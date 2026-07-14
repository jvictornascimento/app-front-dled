import { WoodProductScreen } from "@/components/admin/wood-product-screen";

export default async function EditWoodProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WoodProductScreen mode="edit" id={id} />;
}
