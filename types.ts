
export type CategoryType = 'RECCEITA' | 'DESPESA';

export interface BaseItem {
  id: string;
  name: string;
}

export interface ChartOfAccounts {
  incomeTypes: BaseItem[];
  expenseTypes: BaseItem[];
  banks: BaseItem[];
  paymentMethods: BaseItem[];
}

export interface Entry {
  id: string;
  date: string;
  type: CategoryType;
  categoryId: string; // Refers to incomeTypes or expenseTypes
  description: string;
  paymentMethodId: string;
  bankId: string;
  clientName: string;
  value: number;
}

export enum Page {
  CHART_OF_ACCOUNTS = 'plano-de-contas',
  ENTRIES = 'lancamentos',
  REPORTS = 'relatorios'
}
