import { useData } from '../contexts/DataContext';

/** Provides user management operations */
export function useUsers() {
  const { users, createUser, updateUser } = useData();

  const consultores = users.filter((u) => u.perfil === 'consultor' && u.ativo);
  const clientes = users.filter((u) => u.perfil === 'cliente' && u.ativo);
  const activeUsers = users.filter((u) => u.ativo);

  const getUserById = (id: string) => users.find((u) => u.id === id);
  const getUserName = (id: string) => getUserById(id)?.nome ?? '—';

  return { users, consultores, clientes, activeUsers, getUserById, getUserName, createUser, updateUser };
}
