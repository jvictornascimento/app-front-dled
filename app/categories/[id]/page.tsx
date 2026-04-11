import { EntityFormScreen } from "@/components/admin/entity-form-screen";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityFormScreen entityKey="categories" mode="edit" id={id} />;
}
