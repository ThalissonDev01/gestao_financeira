import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Payables() {
  const { data: payables = [], refetch } = trpc.payables.list.useQuery();
  const createMutation = trpc.payables.create.useMutation();
  const updateMutation = trpc.payables.update.useMutation();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "0",
    dueDate: new Date().toISOString().split("T")[0],
    paymentDate: "",
    status: "pending" as const,
    paymentMethod: "bank_transfer" as const,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          description: formData.description,
          amount: formData.amount,
          dueDate: new Date(formData.dueDate),
          paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : undefined,
          status: formData.status,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        });
        toast.success("Conta a pagar atualizada");
      } else {
        await createMutation.mutateAsync({
          description: formData.description,
          amount: formData.amount,
          dueDate: new Date(formData.dueDate),
          paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : undefined,
          status: formData.status,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        });
        toast.success("Conta a pagar criada");
      }
      setOpen(false);
      setEditingId(null);
      setFormData({
        description: "",
        amount: "0",
        dueDate: new Date().toISOString().split("T")[0],
        paymentDate: "",
        status: "pending",
        paymentMethod: "bank_transfer",
        notes: "",
      });
      refetch();
    } catch (error) {
      toast.error("Erro ao salvar conta a pagar");
    }
  };

  const handleEdit = (payable: any) => {
    setEditingId(payable.id);
    setFormData({
      description: payable.description,
      amount: payable.amount,
      dueDate: new Date(payable.dueDate).toISOString().split("T")[0],
      paymentDate: payable.paymentDate ? new Date(payable.paymentDate).toISOString().split("T")[0] : "",
      status: payable.status,
      paymentMethod: payable.paymentMethod || "bank_transfer",
      notes: payable.notes || "",
    });
    setOpen(true);
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "partial":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusLabels = {
    pending: "Pendente",
    partial: "Parcial",
    paid: "Pago",
    overdue: "Vencido",
    cancelled: "Cancelado",
  };

  const overduePayables = payables.filter((p) => p.status === "overdue" || p.status === "pending");
  const totalOverdue = overduePayables.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Contas a Pagar</h2>
          <p className="text-muted-foreground">Gerencie suas obrigações financeiras</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({
                description: "",
                amount: "0",
                dueDate: new Date().toISOString().split("T")[0],
                paymentDate: "",
                status: "pending",
                paymentMethod: "bank_transfer",
                notes: "",
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta a Pagar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Nova"} Conta a Pagar</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Aluguel"
                  required
                />
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data de Vencimento</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Data de Pagamento</label>
                  <Input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="partial">Parcial</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Método de Pagamento</label>
                <Select value={formData.paymentMethod} onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="check">Cheque</SelectItem>
                    <SelectItem value="bank_transfer">Transferência</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
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
                {editingId ? "Atualizar" : "Criar"} Conta a Pagar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {totalOverdue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Contas Vencidas</p>
                <p className="text-sm text-red-700">{formatCurrency(totalOverdue.toString())} em {overduePayables.length} conta(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {payables.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Nenhuma conta a pagar registrada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payables.map((payable) => (
            <Card key={payable.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{payable.description}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(payable.status)}`}>
                        {statusLabels[payable.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="text-xs">Vencimento</p>
                        <p className="font-medium text-foreground">
                          {new Date(payable.dueDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs">Valor</p>
                        <p className="font-medium text-foreground">{formatCurrency(payable.amount)}</p>
                      </div>
                      {payable.paymentDate && (
                        <div>
                          <p className="text-xs">Pagamento</p>
                          <p className="font-medium text-foreground">
                            {new Date(payable.paymentDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      )}
                      {payable.paymentMethod && (
                        <div>
                          <p className="text-xs">Método</p>
                          <p className="font-medium text-foreground capitalize">{payable.paymentMethod}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(payable)}
                      className="p-2 hover:bg-accent rounded-md transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
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
