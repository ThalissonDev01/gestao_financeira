import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Receivables() {
  const { data: receivables = [], refetch } = trpc.receivables.list.useQuery();
  const createMutation = trpc.receivables.create.useMutation();
  const updateMutation = trpc.receivables.update.useMutation();

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
        toast.success("Conta a receber atualizada");
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
        toast.success("Conta a receber criada");
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
      toast.error("Erro ao salvar conta a receber");
    }
  };

  const handleEdit = (receivable: any) => {
    setEditingId(receivable.id);
    setFormData({
      description: receivable.description,
      amount: receivable.amount,
      dueDate: new Date(receivable.dueDate).toISOString().split("T")[0],
      paymentDate: receivable.paymentDate ? new Date(receivable.paymentDate).toISOString().split("T")[0] : "",
      status: receivable.status,
      paymentMethod: receivable.paymentMethod || "bank_transfer",
      notes: receivable.notes || "",
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
      case "received":
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
    received: "Recebido",
    overdue: "Vencido",
    cancelled: "Cancelado",
  };

  const overdueReceivables = receivables.filter((r) => r.status === "overdue" || r.status === "pending");
  const totalOverdue = overdueReceivables.reduce((sum, r) => sum + parseFloat(r.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Contas a Receber</h2>
          <p className="text-muted-foreground">Gerencie suas receitas esperadas</p>
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
              Nova Conta a Receber
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Nova"} Conta a Receber</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Venda de produto"
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
                  <label className="text-sm font-medium">Data de Recebimento</label>
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
                    <SelectItem value="received">Recebido</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Método de Recebimento</label>
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
                {editingId ? "Atualizar" : "Criar"} Conta a Receber
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {totalOverdue > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">Contas Vencidas</p>
                <p className="text-sm text-orange-700">{formatCurrency(totalOverdue.toString())} em {overdueReceivables.length} conta(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {receivables.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Nenhuma conta a receber registrada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {receivables.map((receivable) => (
            <Card key={receivable.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{receivable.description}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(receivable.status)}`}>
                        {statusLabels[receivable.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="text-xs">Vencimento</p>
                        <p className="font-medium text-foreground">
                          {new Date(receivable.dueDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs">Valor</p>
                        <p className="font-medium text-foreground">{formatCurrency(receivable.amount)}</p>
                      </div>
                      {receivable.paymentDate && (
                        <div>
                          <p className="text-xs">Recebimento</p>
                          <p className="font-medium text-foreground">
                            {new Date(receivable.paymentDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      )}
                      {receivable.paymentMethod && (
                        <div>
                          <p className="text-xs">Método</p>
                          <p className="font-medium text-foreground capitalize">{receivable.paymentMethod}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(receivable)}
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
