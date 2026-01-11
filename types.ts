
export type CategoryType = 'RECEITA' | 'DESPESA' | 'COMPRA';

export interface BaseItem {
  id: string;
  name: string;
}

export interface ChartOfAccounts {
  incomeTypes: BaseItem[];
  expenseTypes: BaseItem[];
  purchaseTypes: BaseItem[];
  banks: BaseItem[];
  paymentMethods: BaseItem[];
}

export interface Entry {
  id: string;
  date: string;
  type: CategoryType;
  categoryId: string; // Refers to incomeTypes, expenseTypes or purchaseTypes
  description: string;
  paymentMethodId: string;
  bankId: string;
  clientName: string;
  value: number;
}

export interface User {
  id: string; // UUID (chave estrangeira do auth.users.id)
  login: string;
  role: 'admin' | 'operator';
}

export enum Page {
  CHART_OF_ACCOUNTS = 'plano-de-contas',
  ENTRIES = 'lancamentos',
  REPORTS = 'relatorios',
  USERS = 'usuarios'
}
