import { EntityFormScreen } from "@/components/admin/entity-form-screen";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityFormScreen entityKey="users" mode="edit" id={id} />;
}
