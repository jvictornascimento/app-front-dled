import { EntityFormScreen } from "@/components/admin/entity-form-screen";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityFormScreen entityKey="products" mode="edit" id={id} />;
}
