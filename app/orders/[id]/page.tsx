import { EntityFormScreen } from "@/components/admin/entity-form-screen";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityFormScreen entityKey="orders" mode="edit" id={id} />;
}
