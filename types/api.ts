export type ProductStatus = "AVAILABLE" | "UNAVAILABLE" | "ON_REQUEST";
export type UserRole = "ADMIN" | "USER" | "EMPLOY" | "SELLER" | "CLIENT";
export type CompanyType = "OWN" | "SUPPLIER";
export type PrintTemplateUsageContext = "PRINTS_MENU" | "PRODUCT" | "WOOD" | "ORDER" | "MONTH_LABEL" | "REPORT";

export interface StandardError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface CategoryTreeDTO {
  id: number;
  name: string;
  imgUrl: string | null;
  active: boolean;
  children: CategoryTreeDTO[];
}

export interface CategoryDTO {
  id: number;
  name: string;
  imgUrl: string | null;
  active: boolean;
  parentId: number | null;
}

export interface ProductCategoryRef {
  id: number;
  name: string;
}

export interface ProductCardDto {
  id: number;
  name: string;
  price: number | null;
  iconUrl: string | null;
  codigoRusso: number;
  codigoMali: number;
  categories: ProductCategoryRef[];
}

export interface ProductGalleryImageDto {
  id: number;
  imageUrl: string;
}

export interface ProductDetailDto {
  id: number;
  name: string;
  codigoRusso: number;
  codigoMali: number;
  categories: ProductCategoryRef[];
  status: ProductStatus;
  descricao: string | null;
  restricoesDeUso: string | null;
  recomendacoesDeUso: string | null;
  observacoesEspeciais: string | null;
  ip: number;
  amper: number;
  watts: number;
  gtin: number;
  volt: number;
  imgUrl: string | null;
  price: number | null;
  iconUrl: string | null;
  temperaturaDeCor: string | null;
  ledsPorMetro: number;
  tipoLed: string | null;
  fluxoLuminoso: string | null;
  indiceDeReproducaoDeCor: string | null;
  quantidePorRolo: number;
  sessaoDeCorte: number;
  espessura: number;
  blindada: boolean;
  dimensao: string | null;
  galleryImages: ProductGalleryImageDto[];
  createdAt: string;
  active: boolean;
}

export interface CompanyDto {
  id: number;
  shortName: string;
  fullName: string;
  type: CompanyType;
  createdAt: string;
}

export interface OrderCompanyDto {
  id: number;
  shortName: string;
  fullName: string;
  type: CompanyType;
}

export interface OrderProductDto {
  id: number;
  name: string;
  status: ProductStatus;
}

export interface OrderDto {
  id: number;
  purchaseDate: string;
  lot: string;
  products: OrderProductDto[];
  company: OrderCompanyDto;
  createdAt: string;
}

export interface UserDto {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  companyName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserDto;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface PrintTemplateListDto {
  id: number;
  name: string;
  description: string | null;
  usageContext: PrintTemplateUsageContext;
  active: boolean;
  widthMm: number | null;
  heightMm: number | null;
  updatedAt: string;
}

export interface PrintTemplateDto extends PrintTemplateListDto {
  templateJson: string;
  createdAt: string;
}

export interface PrintTemplatePayload {
  name: string;
  description: string | null;
  usageContext: PrintTemplateUsageContext;
  active: boolean;
  templateJson: string;
  widthMm: number | null;
  heightMm: number | null;
}

export interface WoodCategorySimpleDto {
  id: number;
  name: string;
}

export interface WoodProductListDto {
  id: number;
  imgUrl: string | null;
  name: string;
  caixa: string | null;
  active: boolean;
}

export interface WoodProductVariationDto {
  id: number;
  color: string | null;
  sku: number | null;
  ean: number | null;
  listImgs: string[];
  labelImageUrl: string | null;
  labelImagePublicId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WoodProductFullDto {
  id: number;
  imgUrl: string | null;
  name: string;
  description: string | null;
  caixa: string | null;
  price: number | null;
  widthMm: number | null;
  heightMm: number | null;
  lengthMm: number | null;
  weightKg: number | null;
  categories: WoodCategorySimpleDto[];
  variations: WoodProductVariationDto[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
