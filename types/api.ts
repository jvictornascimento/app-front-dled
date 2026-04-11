export type ProductStatus = "AVAILABLE" | "UNAVAILABLE" | "ON_REQUEST";
export type UserRole = "ADMIN" | "USER" | "EMPLOY" | "SELLER" | "CLIENT";
export type CompanyType = "OWN" | "SUPPLIER";

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
  url: string;
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
