from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

TARGET_BASE_URL = os.environ.get(
    "ARDUINO_BRIDGE_TARGET",
    "https://parking-api-9oag.onrender.com",
).rstrip("/")
# Optional secondary backend. In the local Docker mode the primary target is the
# local backend and this fallback is Render: if the primary is unreachable
# (timeout / connection error, NOT an HTTP error response) the request is retried
# here. Empty by default => identical behaviour to the single-target bridge.
FALLBACK_BASE_URL = os.environ.get("ARDUINO_BRIDGE_FALLBACK", "").rstrip("/")
HOST = os.environ.get("ARDUINO_BRIDGE_HOST", "0.0.0.0")
PORT = int(os.environ.get("ARDUINO_BRIDGE_PORT", "8080"))
# Per-target timeout. Lower it (e.g. 10) when the primary is local so an offline
# backend fails fast and the fallback is tried quickly.
REQUEST_TIMEOUT = int(os.environ.get("ARDUINO_BRIDGE_TIMEOUT", "45"))
ALLOWED_PATH_PREFIX = "/api/v1/arduino/"


def parse_json_body(body: bytes) -> dict[str, object]:
    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {}

    return payload if isinstance(payload, dict) else {}


def compact_response_body(path: str, status: int, payload: dict[str, object], body: bytes) -> bytes:
    if status != 200 or not payload:
        return body

    if path.endswith("/entry/tickets"):
        compact_payload = {
            "ticket_code": payload.get("ticket_code"),
            "available_spaces": payload.get("available_spaces"),
        }
    elif path.endswith("/exit/validate"):
        compact_payload = {
            "authorized": payload.get("authorized"),
            "message": payload.get("message"),
            "reason": payload.get("reason"),
        }
    else:
        return body

    return json.dumps(compact_payload, separators=(",", ":")).encode("utf-8")


class LoggingThreadingHTTPServer(ThreadingHTTPServer):
    def get_request(self):
        request, client_address = super().get_request()
        print(f"TCP connection from {client_address[0]}:{client_address[1]}")
        return request, client_address


class ArduinoBridgeHandler(BaseHTTPRequestHandler):
    server_version = "ArduinoHTTPBridge/0.1"

    def do_GET(self) -> None:
        if self.path == "/health":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")
            return

        self.send_error(404)

    def do_POST(self) -> None:
        if not self.path.startswith(ALLOWED_PATH_PREFIX):
            self.send_error(404, "Only Arduino API paths are proxied")
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length)
        print(f"DEBUG: raw body bytes = {body!r}")

        headers = {
            "Content-Type": self.headers.get("Content-Type", "application/json"),
            "X-Device-Id": self.headers.get("X-Device-Id", ""),
            "X-Device-Token": self.headers.get("X-Device-Token", ""),
        }
        print(
            "Forward POST "
            f"{self.path} device_id={headers['X-Device-Id'] or '<missing>'} "
            f"token_len={len(headers['X-Device-Token'])} body_len={len(body)}"
        )

        targets = [("primary", TARGET_BASE_URL)]
        if FALLBACK_BASE_URL:
            targets.append(("fallback", FALLBACK_BASE_URL))

        last_failure: tuple[str, str] = ("url", "no target configured")
        for index, (label, base_url) in enumerate(targets):
            failure = self._forward(label, base_url, body, headers)
            if failure is None:
                return  # Response already written (success or HTTP-error passthrough).
            last_failure = failure
            if index + 1 < len(targets):
                print(f"{label} target unreachable ({failure[1]}); trying fallback")

        self._send_unreachable(last_failure)

    def _forward(
        self, label: str, base_url: str, body: bytes, headers: dict[str, str]
    ) -> tuple[str, str] | None:
        """Forward to one backend. Returns None if a response was written, or a
        (kind, reason) failure tuple if the target was unreachable (try next)."""
        target_url = f"{base_url}{self.path}"
        request = Request(target_url, data=body, headers=headers, method="POST")

        try:
            with urlopen(request, timeout=REQUEST_TIMEOUT) as response:
                response_body = response.read()
                print(
                    f"Target [{label}] response {response.status} "
                    f"body={response_body.decode('utf-8', 'replace')[:200]}"
                )
                response_payload = parse_json_body(response_body)
                response_body = compact_response_body(
                    self.path,
                    response.status,
                    response_payload,
                    response_body,
                )
                print(
                    f"Bridge response {response.status} served_by={label} "
                    f"body={response_body.decode('utf-8', 'replace')[:200]}"
                )
                self.send_response(response.status)
                self.send_header(
                    "Content-Type",
                    response.headers.get("Content-Type", "application/json"),
                )
                ticket_code = response_payload.get("ticket_code")
                available_spaces = response_payload.get("available_spaces")
                if ticket_code is not None:
                    self.send_header("X-Ticket-Code", str(ticket_code))
                if available_spaces is not None:
                    self.send_header("X-Available-Spaces", str(available_spaces))
                self.send_header("Content-Length", str(len(response_body)))
                self.end_headers()
                self.wfile.write(response_body)
            return None
        except HTTPError as error:
            # A 4xx/5xx is a real answer from the backend: pass it through as-is
            # and do NOT fall back (the request was processed, just rejected).
            response_body = error.read()
            print(
                f"Target [{label}] response {error.code} "
                f"body={response_body.decode('utf-8', 'replace')[:200]}"
            )
            self.send_response(error.code)
            self.send_header(
                "Content-Type",
                error.headers.get("Content-Type", "application/json"),
            )
            self.send_header("Content-Length", str(len(response_body)))
            self.end_headers()
            self.wfile.write(response_body)
            return None
        except TimeoutError:
            print(f"[{label}] request timed out for {self.path}")
            return ("timeout", "timeout")
        except URLError as error:
            print(f"[{label}] URL error for {self.path}: {error.reason}")
            return ("url", str(error.reason))

    def _send_unreachable(self, failure: tuple[str, str]) -> None:
        kind, reason = failure
        if kind == "timeout":
            payload = b'{"error":"gateway_timeout","message":"Backend too slow"}'
            status = 504
        else:
            message = f'{{"error":"bridge_target_unreachable","message":"{reason}"}}'
            payload = message.encode("utf-8")
            status = 502
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format: str, *args: object) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))


def main() -> None:
    server = LoggingThreadingHTTPServer((HOST, PORT), ArduinoBridgeHandler)
    print(f"Arduino HTTP bridge listening on http://{HOST}:{PORT}")
    print(f"Primary target: {TARGET_BASE_URL}")
    if FALLBACK_BASE_URL:
        print(f"Fallback target: {FALLBACK_BASE_URL} (timeout {REQUEST_TIMEOUT}s per target)")
    else:
        print("Fallback target: <none>")
    server.serve_forever()


if __name__ == "__main__":
    main()
