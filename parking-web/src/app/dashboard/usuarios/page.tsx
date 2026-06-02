import { Grid, Heading } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { UsersManager } from "@/components/dashboard/UsersManager";
import { getStaffUsers } from "@/lib/api/users";
import { getServerAccessToken } from "@/lib/auth/server";

export default async function UsersPage() {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  const users = await getStaffUsers(accessToken);

  return (
    <Grid gap="5">
      <Heading color="opsText">Usuarios</Heading>
      <UsersManager initialUsers={users} accessToken={accessToken} />
    </Grid>
  );
}
