'use client';

import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import styles from './NewTransactionModal.module.css';

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Despesa' },
  { value: 'income', label: 'Receita' },
];

/**
 * Modal "Nova transação" apenas visual: ainda não existe endpoint de criação
 * de transação avulsa, então o envio só fecha o diálogo.
 */
export function NewTransactionModal({
  categories,
  onClose,
}: {
  categories: string[];
  onClose: () => void;
}) {
  const fieldId = useId();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState(categories[0] ?? '');

  const categoryOptions = categories.map((name) => ({
    value: name,
    label: name,
  }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onClose();
  };

  return (
    <Modal
      title="Nova transação"
      subtitle="Registre uma receita ou despesa do período."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.fields}>
          <Input
            id={`${fieldId}-description`}
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: Mercado do mês"
          />
          <Select
            id={`${fieldId}-type`}
            label="Tipo"
            options={TYPE_OPTIONS}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
          <Input
            id={`${fieldId}-amount`}
            label="Valor (R$)"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
          />
          <Select
            id={`${fieldId}-category`}
            label="Categoria"
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
