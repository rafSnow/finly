"use client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

export default function Ajustes() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Ajustes</h2>

      <Card>
        <h3 className="text-lg font-semibold text-gray-700">Meu Perfil</h3>
        <p className="text-gray-600 text-sm mt-1">
          Nome: {user?.displayName || "Não informado"}
        </p>
        <p className="text-gray-600 text-sm">E-mail: {user?.email}</p>
      </Card>

      <Button variant="danger" onClick={signOut}>
        Sair (Logout)
      </Button>
    </div>
  );
}
