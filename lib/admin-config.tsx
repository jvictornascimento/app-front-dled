import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime, titleCase } from "@/lib/format";
import type {
  CategoryDTO,
  CategoryTreeDTO,
  CompanyDto,
  ProductCardDto,
  ProductDetailDto,
  UserDto,
} from "@/types/api";

export type EntityKey = "products" | "categories" | "companies" | "orders" | "users";
export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "multiselect"
  | "date";

export type FormValues = Record<string, string | boolean | string[]>;

export interface SelectOption {
  label: string;
  value: string;
  note?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  span?: 1 | 2;
  placeholder?: string;
  helpText?: string;
  step?: string;
  options?: SelectOption[];
}

export interface ListColumn {
  label: string;
  render: (item: Record<string, unknown>) => ReactNode;
}

export interface EntityDefinition {
  key: EntityKey;
  label: string;
  singularLabel: string;
  route: string;
  listDescription: string;
  formDescription: string;
  note?: string;
  getList: () => Promise<Record<string, unknown>[]>;
  getOne: (id: string) => Promise<Record<string, unknown>>;
  create: (payload: unknown) => Promise<unknown>;
  update: (id: string, payload: unknown) => Promise<unknown>;
  remove: (id: string) => Promise<void>;
  loadOptions?: () => Promise<Record<string, unknown>>;
  getDefaultValues: (options: Record<string, unknown>) => FormValues;
  mapToValues: (item: Record<string, unknown>, options: Record<string, unknown>) => FormValues;
  buildPayload: (values: FormValues) => unknown;
  getColumns: () => ListColumn[];
  getFields: (options: Record<string, unknown>) => FormField[];
}

const productStatusOptions: SelectOption[] = [
  { label: "Disponivel", value: "AVAILABLE" },
  { label: "Indisponivel", value: "UNAVAILABLE" },
  { label: "Sob consulta", value: "ON_REQUEST" },
];

const companyTypeOptions: SelectOption[] = [
  { label: "Empresa propria", value: "OWN" },
  { label: "Fornecedor", value: "SUPPLIER" },
];

const userRoleOptions: SelectOption[] = [
  { label: "Administrador", value: "ADMIN" },
  { label: "Usuario", value: "USER" },
  { label: "Funcionario", value: "EMPLOY" },
  { label: "Vendedor", value: "SELLER" },
  { label: "Cliente", value: "CLIENT" },
];

function toStringValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function toBooleanValue(value: unknown) {
  return Boolean(value);
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function parseRequiredNumber(values: FormValues, key: string) {
  return Number(values[key] || 0);
}

function parseOptionalNumber(values: FormValues, key: string) {
  const raw = String(values[key] ?? "").trim();
  return raw ? Number(raw) : null;
}

function flattenCategoryTree(tree: CategoryTreeDTO[], prefix = ""): SelectOption[] {
  return tree.flatMap((item) => {
    const currentLabel = prefix ? `${prefix} / ${item.name}` : item.name;

    return [
      { label: currentLabel, value: String(item.id) },
      ...flattenCategoryTree(item.children, currentLabel),
    ];
  });
}

function flattenCategoryList(tree: CategoryTreeDTO[]) {
  return tree.flatMap((item) => [
    {
      id: item.id,
      name: item.name,
      imgUrl: item.imgUrl,
      active: item.active,
      parentId: null as number | null,
    },
    ...item.children.map((child) => ({
      id: child.id,
      name: child.name,
      imgUrl: child.imgUrl,
      active: child.active,
      parentId: item.id,
    })),
  ]);
}

function mapProductFormValues(product?: ProductDetailDto): FormValues {
  return {
    name: product?.name ?? "",
    codigoRusso: toStringValue(product?.codigoRusso),
    codigoMali: toStringValue(product?.codigoMali),
    categoryIds: product?.categories?.map((category) => String(category.id)) ?? [],
    status: product?.status ?? "AVAILABLE",
    descricao: product?.descricao ?? "",
    restricoesDeUso: product?.restricoesDeUso ?? "",
    recomendacoesDeUso: product?.recomendacoesDeUso ?? "",
    observacoesEspeciais: product?.observacoesEspeciais ?? "",
    ip: toStringValue(product?.ip ?? 0),
    amper: toStringValue(product?.amper ?? 0),
    watts: toStringValue(product?.watts ?? 0),
    gtin: toStringValue(product?.gtin ?? 0),
    volt: toStringValue(product?.volt ?? 0),
    price: toStringValue(product?.price ?? ""),
    temperaturaDeCor: product?.temperaturaDeCor ?? "",
    ledsPorMetro: toStringValue(product?.ledsPorMetro ?? 0),
    tipoLed: product?.tipoLed ?? "",
    fluxoLuminoso: product?.fluxoLuminoso ?? "",
    indiceDeReproducaoDeCor: product?.indiceDeReproducaoDeCor ?? "",
    quantidePorRolo: toStringValue(product?.quantidePorRolo ?? 0),
    sessaoDeCorte: toStringValue(product?.sessaoDeCorte ?? 0),
    espessura: toStringValue(product?.espessura ?? 0),
    blindada: product?.blindada ?? false,
    dimensao: product?.dimensao ?? "",
    active: product?.active ?? true,
  };
}

function productFields(options: Record<string, unknown>): FormField[] {
  const categories = (options.categoryOptions as SelectOption[]) ?? [];

  return [
    { name: "name", label: "Nome comercial", type: "text", required: true },
    { name: "status", label: "Status", type: "select", required: true, options: productStatusOptions },
    { name: "codigoRusso", label: "Codigo Russo", type: "number", required: true },
    { name: "codigoMali", label: "Codigo Mali", type: "number", required: true },
    {
      name: "categoryIds",
      label: "Categorias",
      type: "multiselect",
      required: true,
      span: 2,
      options: categories,
      helpText: "O backend exige pelo menos uma categoria por produto.",
    },
    { name: "descricao", label: "Descricao", type: "textarea", span: 2 },
    { name: "restricoesDeUso", label: "Restricoes de uso", type: "textarea" },
    { name: "recomendacoesDeUso", label: "Recomendacoes de uso", type: "textarea" },
    { name: "observacoesEspeciais", label: "Observacoes especiais", type: "textarea", span: 2 },
    { name: "ip", label: "IP", type: "number", required: true },
    { name: "amper", label: "Amperagem", type: "number", required: true },
    { name: "watts", label: "Potencia (W)", type: "number", required: true },
    { name: "gtin", label: "GTIN", type: "number", required: true },
    { name: "volt", label: "Voltagem", type: "number", required: true },
    { name: "price", label: "Preco", type: "number", step: "0.01" },
    { name: "temperaturaDeCor", label: "Temperatura de cor", type: "text" },
    { name: "ledsPorMetro", label: "Leds por metro", type: "number", required: true },
    { name: "tipoLed", label: "Tipo de LED", type: "text" },
    { name: "fluxoLuminoso", label: "Fluxo luminoso", type: "text" },
    { name: "indiceDeReproducaoDeCor", label: "IRC", type: "text" },
    { name: "quantidePorRolo", label: "Quantidade por rolo", type: "number", required: true },
    { name: "sessaoDeCorte", label: "Sessao de corte (mm)", type: "number", required: true },
    { name: "espessura", label: "Espessura (mm)", type: "number", required: true },
    { name: "dimensao", label: "Dimensao", type: "text" },
    { name: "blindada", label: "Blindada", type: "checkbox" },
    { name: "active", label: "Ativo", type: "checkbox" },
  ];
}

function categoryFields(options: Record<string, unknown>): FormField[] {
  const treeOptions = [{ label: "Categoria raiz", value: "" }, ...((options.categoryOptions as SelectOption[]) ?? [])];

  return [
    { name: "name", label: "Nome", type: "text", required: true },
    { name: "imgUrl", label: "Imagem publica", type: "text" },
    { name: "parentId", label: "Categoria pai", type: "select", options: treeOptions },
    { name: "active", label: "Ativa", type: "checkbox" },
  ];
}

function companyFields(): FormField[] {
  return [
    { name: "shortName", label: "Nome curto", type: "text", required: true },
    { name: "fullName", label: "Nome completo", type: "text", required: true, span: 2 },
    { name: "type", label: "Tipo", type: "select", required: true, options: companyTypeOptions },
  ];
}

function orderFields(options: Record<string, unknown>): FormField[] {
  return [
    { name: "purchaseDate", label: "Data da compra", type: "date", required: true },
    { name: "lot", label: "Lote", type: "text", required: true },
    {
      name: "companyId",
      label: "Empresa",
      type: "select",
      required: true,
      options: (options.companyOptions as SelectOption[]) ?? [],
    },
    {
      name: "productIds",
      label: "Produtos",
      type: "multiselect",
      required: true,
      span: 2,
      options: (options.productOptions as SelectOption[]) ?? [],
    },
  ];
}

function userFields(isEditing: boolean): FormField[] {
  return [
    { name: "fullName", label: "Nome completo", type: "text", required: true, span: 2 },
    { name: "username", label: "Usuario", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Telefone", type: "text", required: true },
    { name: "companyName", label: "Empresa em texto", type: "text", required: true },
    {
      name: "password",
      label: isEditing ? "Nova senha" : "Senha",
      type: "password",
      required: !isEditing,
      helpText: "A senha deve ter entre 8 e 20 caracteres com maiuscula, minuscula, numero e especial.",
    },
    { name: "role", label: "Perfil", type: "select", required: true, options: userRoleOptions },
    { name: "active", label: "Ativo", type: "checkbox" },
  ];
}

export const navigationItems = [
  { href: "/dashboard", title: "Painel", meta: "Visao geral" },
  { href: "/products", title: "Produtos", meta: "Catalogo tecnico" },
  { href: "/categories", title: "Categorias", meta: "Estrutura comercial" },
  { href: "/companies", title: "Empresas", meta: "Origem e fornecedores" },
  { href: "/orders", title: "Pedidos", meta: "Compras e lotes" },
  { href: "/users", title: "Usuarios", meta: "Acesso operacional" },
  { href: "/settings", title: "Configuracoes", meta: "Tema e layout" },
];

export const entityDefinitions: Record<EntityKey, EntityDefinition> = {
  products: {
    key: "products",
    label: "Produtos",
    singularLabel: "produto",
    route: "/products",
    listDescription: "Edite o catalogo tecnico do backend e mantenha status, codigos, categorias e especificacoes coerentes com a API.",
    formDescription: "O contrato atual do backend aceita apenas os campos textuais e tecnicos. Upload de imagem continua em endpoint separado.",
    note: "As imagens do produto nao entram no payload de criacao e edicao. Use os endpoints especificos depois do cadastro, se necessario.",
    getList: async () => (await api.listProducts()) as unknown as Record<string, unknown>[],
    getOne: async (id) => (await api.getProduct(id)) as unknown as Record<string, unknown>,
    create: (payload) => api.createProduct(payload),
    update: (id, payload) => api.updateProduct(id, payload),
    remove: (id) => api.deleteProduct(id),
    loadOptions: async () => {
      const tree = await api.listCategoriesTree();
      return {
        categoryOptions: flattenCategoryTree(tree),
      };
    },
    getDefaultValues: () => mapProductFormValues(),
    mapToValues: (item) => mapProductFormValues(item as unknown as ProductDetailDto),
    buildPayload: (values) => ({
      name: values.name,
      codigoRusso: parseRequiredNumber(values, "codigoRusso"),
      codigoMali: parseRequiredNumber(values, "codigoMali"),
      categoryIds: asStringArray(values.categoryIds).map(Number),
      status: values.status,
      descricao: values.descricao || null,
      restricoesDeUso: values.restricoesDeUso || null,
      recomendacoesDeUso: values.recomendacoesDeUso || null,
      observacoesEspeciais: values.observacoesEspeciais || null,
      ip: parseRequiredNumber(values, "ip"),
      amper: parseRequiredNumber(values, "amper"),
      watts: parseRequiredNumber(values, "watts"),
      gtin: parseRequiredNumber(values, "gtin"),
      volt: parseRequiredNumber(values, "volt"),
      price: parseOptionalNumber(values, "price"),
      temperaturaDeCor: values.temperaturaDeCor || null,
      ledsPorMetro: parseRequiredNumber(values, "ledsPorMetro"),
      tipoLed: values.tipoLed || null,
      fluxoLuminoso: values.fluxoLuminoso || null,
      indiceDeReproducaoDeCor: values.indiceDeReproducaoDeCor || null,
      quantidePorRolo: parseRequiredNumber(values, "quantidePorRolo"),
      sessaoDeCorte: parseRequiredNumber(values, "sessaoDeCorte"),
      espessura: parseRequiredNumber(values, "espessura"),
      blindada: toBooleanValue(values.blindada),
      dimensao: values.dimensao || null,
      active: toBooleanValue(values.active),
    }),
    getColumns: () => [
      { label: "Produto", render: (item) => item.name as ReactNode },
      {
        label: "Status",
        render: (item) => (
          <span className="badge badge--accent">{titleCase(String(item.status ?? "AVAILABLE"))}</span>
        ),
      },
      { label: "Russo", render: (item) => item.codigoRusso as ReactNode },
      { label: "Mali", render: (item) => item.codigoMali as ReactNode },
      {
        label: "Preco",
        render: (item) => formatCurrency((item.price as number | null) ?? 0),
      },
      {
        label: "Categorias",
        render: (item) =>
          ((item.categories as ProductCardDto["categories"]) ?? []).map((category) => category.name).join(", ") || "Sem categoria",
      },
    ],
    getFields: productFields,
  },
  categories: {
    key: "categories",
    label: "Categorias",
    singularLabel: "categoria",
    route: "/categories",
    listDescription: "Organize a arvore comercial do catalogo e controle status, categoria pai e imagem publica.",
    formDescription: "A categoria aceita pai opcional. Use raiz quando nao houver relacao hierarquica.",
    getList: async () => flattenCategoryList(await api.listCategoriesTree()) as unknown as Record<string, unknown>[],
    getOne: async (id) => (await api.getCategory(id)) as unknown as Record<string, unknown>,
    create: (payload) => api.createCategory(payload),
    update: (id, payload) => api.updateCategory(id, payload),
    remove: (id) => api.deleteCategory(id),
    loadOptions: async () => {
      const tree = await api.listCategoriesTree();
      return {
        categoryOptions: flattenCategoryTree(tree),
      };
    },
    getDefaultValues: () => ({
      name: "",
      imgUrl: "",
      parentId: "",
      active: true,
    }),
    mapToValues: (item) => {
      const category = item as unknown as CategoryDTO;
      return {
        name: category.name,
        imgUrl: category.imgUrl ?? "",
        parentId: toStringValue(category.parentId),
        active: category.active,
      };
    },
    buildPayload: (values) => ({
      name: values.name,
      imgUrl: values.imgUrl || null,
      active: toBooleanValue(values.active),
      parentId: values.parentId ? Number(values.parentId) : null,
    }),
    getColumns: () => [
      { label: "Categoria", render: (item) => item.name as ReactNode },
      {
        label: "Hierarquia",
        render: (item) =>
          item.parentId ? <span className="badge badge--muted">Subcategoria</span> : <span className="badge badge--success">Raiz</span>,
      },
      { label: "Pai", render: (item) => (item.parentId ? `#${item.parentId}` : "Sem pai") },
      {
        label: "Status",
        render: (item) =>
          item.active ? <span className="badge badge--success">Ativa</span> : <span className="badge badge--danger">Inativa</span>,
      },
    ],
    getFields: categoryFields,
  },
  companies: {
    key: "companies",
    label: "Empresas",
    singularLabel: "empresa",
    route: "/companies",
    listDescription: "Cadastre empresas internas e fornecedores usados nos fluxos de compras e operacao.",
    formDescription: "O contrato atual exige nome curto, nome completo e tipo.",
    getList: async () => (await api.listCompanies()) as unknown as Record<string, unknown>[],
    getOne: async (id) => (await api.getCompany(id)) as unknown as Record<string, unknown>,
    create: (payload) => api.createCompany(payload),
    update: (id, payload) => api.updateCompany(id, payload),
    remove: (id) => api.deleteCompany(id),
    getDefaultValues: () => ({
      shortName: "",
      fullName: "",
      type: "OWN",
    }),
    mapToValues: (item) => {
      const company = item as unknown as CompanyDto;
      return {
        shortName: company.shortName,
        fullName: company.fullName,
        type: company.type,
      };
    },
    buildPayload: (values) => ({
      shortName: values.shortName,
      fullName: values.fullName,
      type: values.type,
    }),
    getColumns: () => [
      { label: "Nome curto", render: (item) => item.shortName as ReactNode },
      { label: "Nome completo", render: (item) => item.fullName as ReactNode },
      {
        label: "Tipo",
        render: (item) => <span className="badge badge--accent">{titleCase(String(item.type ?? "OWN"))}</span>,
      },
      { label: "Criada em", render: (item) => formatDateTime(item.createdAt as string) },
    ],
    getFields: companyFields,
  },
  orders: {
    key: "orders",
    label: "Pedidos",
    singularLabel: "pedido",
    route: "/orders",
    listDescription: "Controle compras, lotes e vinculos entre produtos e empresas fornecedoras.",
    formDescription: "Pedidos exigem data, lote, empresa e pelo menos um produto vinculado.",
    getList: async () => (await api.listOrders()) as unknown as Record<string, unknown>[],
    getOne: async (id) => (await api.getOrder(id)) as unknown as Record<string, unknown>,
    create: (payload) => api.createOrder(payload),
    update: (id, payload) => api.updateOrder(id, payload),
    remove: (id) => api.deleteOrder(id),
    loadOptions: async () => {
      const [companies, products] = await Promise.all([api.listCompanies(), api.listProducts()]);
      return {
        companyOptions: companies.map((item) => ({
          label: item.shortName,
          value: String(item.id),
          note: item.fullName,
        })),
        productOptions: products.map((item) => ({
          label: item.name,
          value: String(item.id),
          note: `${item.codigoRusso} / ${item.codigoMali}`,
        })),
      };
    },
    getDefaultValues: () => ({
      purchaseDate: "",
      lot: "",
      companyId: "",
      productIds: [],
    }),
    mapToValues: (item) => {
      const order = item as Record<string, unknown>;

      return {
        purchaseDate: toStringValue(order.purchaseDate),
        lot: toStringValue(order.lot),
        companyId: toStringValue((order.company as { id: number }).id),
        productIds: ((order.products as { id: number }[]) ?? []).map((product) => String(product.id)),
      };
    },
    buildPayload: (values) => ({
      purchaseDate: values.purchaseDate,
      lot: values.lot,
      companyId: Number(values.companyId),
      productIds: asStringArray(values.productIds).map(Number),
    }),
    getColumns: () => [
      { label: "Pedido", render: (item) => `#${item.id}` },
      { label: "Data", render: (item) => formatDate(item.purchaseDate as string) },
      { label: "Lote", render: (item) => item.lot as ReactNode },
      {
        label: "Empresa",
        render: (item) => (item.company as { shortName?: string })?.shortName ?? "Sem empresa",
      },
      {
        label: "Produtos",
        render: (item) => ((item.products as { name: string }[]) ?? []).map((product) => product.name).join(", "),
      },
    ],
    getFields: orderFields,
  },
  users: {
    key: "users",
    label: "Usuarios",
    singularLabel: "usuario",
    route: "/users",
    listDescription: "Gerencie contas, perfis de acesso, status e os dados convencionais exigidos pelo backend.",
    formDescription: "A senha segue a politica atual do backend. Na edicao, so envie senha se realmente quiser alteracao.",
    getList: async () => (await api.listUsers()) as unknown as Record<string, unknown>[],
    getOne: async (id) => (await api.getUser(id)) as unknown as Record<string, unknown>,
    create: (payload) => api.createUser(payload),
    update: (id, payload) => api.updateUser(id, payload),
    remove: (id) => api.deleteUser(id),
    getDefaultValues: () => ({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      companyName: "",
      password: "",
      role: "USER",
      active: true,
    }),
    mapToValues: (item) => {
      const user = item as unknown as UserDto;
      return {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        companyName: user.companyName,
        password: "",
        role: user.role,
        active: user.active,
      };
    },
    buildPayload: (values) => {
      const payload = {
        fullName: values.fullName,
        username: values.username,
        email: values.email,
        phone: values.phone,
        companyName: values.companyName,
        role: values.role,
        active: toBooleanValue(values.active),
      } as Record<string, unknown>;

      if (String(values.password ?? "").trim()) {
        payload.password = values.password;
      }

      return payload;
    },
    getColumns: () => [
      { label: "Nome", render: (item) => item.fullName as ReactNode },
      { label: "Usuario", render: (item) => item.username as ReactNode },
      { label: "Empresa", render: (item) => item.companyName as ReactNode },
      { label: "Perfil", render: (item) => <span className="badge badge--accent">{titleCase(String(item.role ?? "USER"))}</span> },
      {
        label: "Status",
        render: (item) =>
          item.active ? <span className="badge badge--success">Ativo</span> : <span className="badge badge--danger">Inativo</span>,
      },
      { label: "Atualizado em", render: (item) => formatDateTime(item.updatedAt as string) },
    ],
    getFields: () => userFields(false),
  },
};

export function getEntityDefinition(key: EntityKey) {
  return entityDefinitions[key];
}

export function getUserFieldsForMode(mode: "create" | "edit") {
  return userFields(mode === "edit");
}
