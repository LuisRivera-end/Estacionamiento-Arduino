import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Providers } from "@/app/providers";
import { SimulationNotice } from "./SimulationNotice";

describe("SimulationNotice", () => {
  it("communicates that payments are simulated", () => {
    render(
      <Providers>
        <SimulationNotice />
      </Providers>,
    );

    expect(screen.getByText(/pago simulado/i)).toBeInTheDocument();
    expect(screen.getByText(/no se realiza cargo real/i)).toBeInTheDocument();
  });
});
