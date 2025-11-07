import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function Transactions() {
  const { data: transactions = [], refetch } = trpc.transactions.list.useQuery();
  const { data: accounts = [] } = trpc.accounts.list.useQuery();
  const { data: categories = [] } = trpc.categories.list.useQuery();

  const createMutation = trpc.transactions.create.useMutation();
  const updateMutation = trpc.transactions.update.useMutation();
  const deleteMutation = trpc.transactions.delete.useMutation();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    accountId: 0,
    categoryId: undefined as number | undefined,
    description: "",
    amount: "0",
    type: "expense" as const,
    status: "completed" as const,
    transactionDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    paymentDate: "",
    notes: "",
    tags: "",
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = filterType === "all" || t.type === filterType;
      const matchAccount = filterAccount === "all" || t.accountId === parseInt(filterAccount);
      const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchAccount && matchSearch;
    });
  }, [transactions, filterType, filterAccount, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.accountId) {
        toast.error("Selecione uma conta");
        return;
      }

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          description: formData.description,
          amount: formData.amount,
          type: formData.type,
          status: formData.status,
          transactionDate: new Date(formData.transactionDate),
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : undefined,
          notes: formData.notes,
          tags: formData.tags,
        });
        toast.success("Transação atualizada");
      } else {
        await createMutation.mutateAsync({
          accountId: formData.accountId,
          categoryId: formData.categoryId,
          description: formData.description,
          amount: formData.amount,
          type: formData.type,
          status: formData.status,
          transactionDate: new Date(formData.transactionDate),
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : undefined,
          notes: formData.notes,
          tags: formData.tags,
        });
        toast.success("Transação criada");
      }
      setOpen(false);
      setEditingId(null);
      setFormData({
        accountId: 0,
        categoryId: undefined,
        description: "",
        amount: "0",
        type: "expense",
        status: "completed",
        transactionDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        paymentDate: "",
        notes: "",
        tags: "",
      });
      refetch();
    } catch (error) {
      toast.error("Erro ao salvar transação");
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingId(transaction.id);
    setFormData({
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      transactionDate: new Date(transaction.transactionDate).toISOString().split("T")[0],
      dueDate: transaction.dueDate ? new Date(transaction.dueDate).toISOString().split("T")[0] : "",
      paymentDate: transaction.paymentDate ? new Date(transaction.paymentDate).toISOString().split("T")[0] : "",
      notes: transaction.notes || "",
      tags: transaction.tags || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar esta transação?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Transação deletada");
        refetch();
      } catch (error) {
        toast.error("Erro ao deletar transação");
      }
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusLabels = {
    pending: "Pendente",
    completed: "Concluída",
    cancelled: "Cancelada",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Transações</h2>
          <p className="text-muted-foreground">Registre e acompanhe todas as suas movimentações</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({
                accountId: 0,
                categoryId: undefined,
                description: "",
                amount: "0",
                type: "expense",
                status: "completed",
                transactionDate: new Date().toISOString().split("T")[0],
                dueDate: "",
                paymentDate: "",
                notes: "",
                tags: "",
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Nova"} Transação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Conta</label>
                <Select value={formData.accountId.toString()} onValueChange={(value) => setFormData({ ...formData, accountId: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Venda de produto"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Data da Transação</label>
                <Input
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tags</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Ex: importante, urgente"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionais"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Atualizar" : "Criar"} Transação
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Conta</label>
              <Select value={filterAccount} onValueChange={setFilterAccount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as contas</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Transações */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transação encontrada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{transaction.description}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                        {statusLabels[transaction.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="text-xs">Data</p>
                        <p className="font-medium text-foreground">
                          {new Date(transaction.transactionDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs">Valor</p>
                        <p className={`font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      {transaction.tags && (
                        <div>
                          <p className="text-xs">Tags</p>
                          <p className="font-medium text-foreground">{transaction.tags}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="p-2 hover:bg-accent rounded-md transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
