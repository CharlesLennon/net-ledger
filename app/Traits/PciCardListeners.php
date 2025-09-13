<?php

namespace App\Traits;

use App\Models\PcieCard;
use Livewire\Attributes\On;

trait PciCardListeners
{
    #[On('on-pci-card-deleted')]
    public function onPciCardDeleted(string $pci_card_id): void
    {
        $pciCard = PcieCard::find($pci_card_id);
        if (! $pciCard) {
            return;
        }

        $pciCard->delete();

        // Reload the page to reflect changes
        $this->redirect(request()->header('Referer'));
    }

    #[On('on-pci-card-cloned')]
    public function onPciCardCloned(string $pci_card_id): void
    {
        $pciCard = PcieCard::find($pci_card_id);
        if (! $pciCard) {
            return;
        }

        $clonedPciCard = $pciCard->replicate();
        $clonedPciCard->model_name = $pciCard->model_name.' (Copy)';
        $clonedPciCard->card_serial_number = $pciCard->card_serial_number.'-copy';
        $clonedPciCard->save();

        // Reload the page to reflect changes
        $this->redirect(request()->header('Referer'));
    }

    #[On('on-pci-card-title-changed')]
    public function onPciCardTitleChanged(string $id, $current = null, $new = null): void
    {
        if ($new) {
            $pciCard = PcieCard::find($id);
            if (! $pciCard) {
                return;
            }

            $pciCard->model_name = $new;
            $pciCard->save();

            // Reload the page to reflect changes
            $this->redirect(request()->header('Referer'));
        } else {
            $this->dispatch('show-edit-panel', 'PCI Card Model', $current, 'on-pci-card-title-changed');
        }
    }

    #[On('on-pci-card-type-changed')]
    public function onPciCardTypeChanged(string $id, $current = null, $new = null): void
    {
        if ($new) {
            $pciCard = PcieCard::find($id);
            if (! $pciCard) {
                return;
            }

            $pciCard->type = $new;
            $pciCard->save();

            // Reload the page to reflect changes
            $this->redirect(request()->header('Referer'));
        } else {
            $this->dispatch('show-edit-panel', 'PCI Card Type', $current, 'on-pci-card-type-changed');
        }
    }

    #[On('on-pci-card-serial-changed')]
    public function onPciCardSerialChanged(string $id, $current = null, $new = null): void
    {
        if ($new) {
            $pciCard = PcieCard::find($id);
            if (! $pciCard) {
                return;
            }

            $pciCard->card_serial_number = $new;
            $pciCard->save();

            // Reload the page to reflect changes
            $this->redirect(request()->header('Referer'));
        } else {
            $this->dispatch('show-edit-panel', 'PCI Card Serial', $current, 'on-pci-card-serial-changed');
        }
    }
}
