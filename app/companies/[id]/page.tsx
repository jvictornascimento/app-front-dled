import { EntityFormScreen } from "@/components/admin/entity-form-screen";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityFormScreen entityKey="companies" mode="edit" id={id} />;
}
