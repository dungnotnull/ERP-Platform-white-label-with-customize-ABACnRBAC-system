import { useState } from "react";
import { useUrlListFilters } from "@/hooks/useUrlListFilters";

import { ContainerIcon } from "lucide-react";
import PageTopBar from "@/components/PageTopBar";
import { Button } from "@/components/ui/Button";
import { PlusCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import SuppliersFilter from "./partial/SuppliersFilter";
import SuppliersDataList from "./partial/SuppliersDataList";
import SupplierFormModal from "./partial/SupplierFormModal";
import NoteDialog from "@/components/ui/NoteDialog";

interface Filters {
  name: string;
  contactPerson: string;
  search: string;
}

const initialFilters = {
  name: "",
  contactPerson: "",
  search: ""
};

const SUPPLIER_FILTER_URL_CONFIG = {
  keys: ["name", "contactPerson", "search"] as (keyof Filters)[],
  searchKeys: ["search", "name", "contactPerson"] as (keyof Filters)[]
};

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  notes: string;
  updatedAt: string;
}

export type FilterKey = keyof Filters | "reset";
export type HandleFilterChange = (key: FilterKey, value?: string) => void;

export default function Suppliers() {
  const { t } = useTranslation();
  const {
    draftFilters,
    appliedFilters,
    handleFilterChange,
    handleApplyFilters
  } = useUrlListFilters(initialFilters, SUPPLIER_FILTER_URL_CONFIG);
  const [reloadDataKey, setReloadDataKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit">("edit");

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const openViewModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setModalMode("view");
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="pr-5 md:pr-[50px] md:pl-0 ">
        <PageTopBar
          title={t("supplier.title")}
          description={t("supplier.description")}
          Icon={ContainerIcon}
          // searchToolbar
          // onSearch={() => {}}
        />

        <SuppliersFilter
          filters={draftFilters}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
        />

        <div className="flex justify-start mb-4 gap-2 flex-wrap">
          <Button
            onClick={() => {
              setEditingSupplier(null);
              setIsModalOpen(true);
            }}
            size="sm"
            className="flex items-center gap-2 hover:bg-blue-900 "
          >
            <PlusCircle className="w-4 h-4" />
            {t("supplier.addSupplier")}
          </Button>
          <div className="flex justify-end flex-1">
            <NoteDialog
              title="supplier.notes.title"
              content="supplier.notes.content"
              triggerLabel="supplier.notes.trigger"
            />
          </div>
        </div>

        <SuppliersDataList
          reloadKey={reloadDataKey}
          filters={appliedFilters}
          onEdit={handleEdit}
          onView={s => openViewModal(s)}
          onReload={() => setReloadDataKey(prev => prev + 1)}
        />

        <SupplierFormModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          supplierToEdit={editingSupplier}
          mode={modalMode}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingSupplier(null);
            setReloadDataKey(prev => prev + 1);
          }}
        />
      </div>
    </>
  );
}
