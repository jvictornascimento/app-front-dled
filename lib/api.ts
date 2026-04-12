import type { AuthResponse, CategoryDTO, CategoryTreeDTO, CompanyDto, OrderDto, ProductCardDto, ProductDetailDto, StandardError, UserDto } from "@/types/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers =
    options.body === undefined
      ? undefined
      : isFormData
        ? undefined
        : { "Content-Type": "application/json" };

  let body: BodyInit | undefined;
  if (options.body === undefined) {
    body = undefined;
  } else if (isFormData) {
    body = options.body as FormData;
  } else {
    body = JSON.stringify(options.body as Record<string, unknown>);
  }

  const response = await fetch(`/api/backend${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Nao foi possivel concluir a solicitacao.";

    try {
      const error = (await response.json()) as Partial<StandardError>;
      message = error.message ?? error.error ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  login(payload: { username: string; password: string }) {
    return request<AuthResponse>("/auth/login", { method: "POST", body: payload });
  },
  logout() {
    return request<{ message: string }>("/auth/logout", { method: "POST" });
  },

  listProducts() {
    return request<ProductCardDto[]>("/products");
  },
  getProduct(id: string) {
    return request<ProductDetailDto>(`/products/${id}`);
  },
  createProduct(payload: unknown) {
    return request<ProductDetailDto>("/products", { method: "POST", body: payload });
  },
  updateProduct(id: string, payload: unknown) {
    return request<ProductDetailDto>(`/products/${id}`, { method: "PUT", body: payload });
  },
  uploadProductMainImage(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<ProductDetailDto>(`/products/${id}/images/main`, { method: "POST", body: formData });
  },
  uploadProductIconImage(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<ProductDetailDto>(`/products/${id}/images/icon`, { method: "POST", body: formData });
  },
  uploadProductGalleryImage(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<ProductDetailDto>(`/products/${id}/gallery`, { method: "POST", body: formData });
  },
  deleteProduct(id: string) {
    return request<void>(`/products/${id}`, { method: "DELETE" });
  },

  listCategoriesTree() {
    return request<CategoryTreeDTO[]>("/categories/tree");
  },
  listRootCategories() {
    return request<CategoryTreeDTO[]>("/categories/root");
  },
  getCategory(id: string) {
    return request<CategoryDTO>(`/categories/${id}`);
  },
  createCategory(payload: unknown) {
    return request<CategoryDTO>("/categories", { method: "POST", body: payload });
  },
  updateCategory(id: string, payload: unknown) {
    return request<CategoryDTO>(`/categories/${id}`, { method: "PUT", body: payload });
  },
  deleteCategory(id: string) {
    return request<void>(`/categories/${id}`, { method: "DELETE" });
  },

  listCompanies() {
    return request<CompanyDto[]>("/companies");
  },
  getCompany(id: string) {
    return request<CompanyDto>(`/companies/${id}`);
  },
  createCompany(payload: unknown) {
    return request<CompanyDto>("/companies", { method: "POST", body: payload });
  },
  updateCompany(id: string, payload: unknown) {
    return request<CompanyDto>(`/companies/${id}`, { method: "PUT", body: payload });
  },
  deleteCompany(id: string) {
    return request<void>(`/companies/${id}`, { method: "DELETE" });
  },

  listOrders() {
    return request<OrderDto[]>("/orders");
  },
  getOrder(id: string) {
    return request<OrderDto>(`/orders/${id}`);
  },
  createOrder(payload: unknown) {
    return request<OrderDto>("/orders", { method: "POST", body: payload });
  },
  updateOrder(id: string, payload: unknown) {
    return request<OrderDto>(`/orders/${id}`, { method: "PUT", body: payload });
  },
  deleteOrder(id: string) {
    return request<void>(`/orders/${id}`, { method: "DELETE" });
  },

  listUsers() {
    return request<UserDto[]>("/users");
  },
  getUser(id: string) {
    return request<UserDto>(`/users/${id}`);
  },
  createUser(payload: unknown) {
    return request<UserDto>("/users", { method: "POST", body: payload });
  },
  updateUser(id: string, payload: unknown) {
    return request<UserDto>(`/users/${id}`, { method: "PUT", body: payload });
  },
  deleteUser(id: string) {
    return request<void>(`/users/${id}`, { method: "DELETE" });
  },
};
