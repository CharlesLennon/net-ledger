<?php

namespace App\Livewire;

use Livewire\Attributes\On;
use Livewire\Component;

class EditPanel extends Component
{
    public bool $showPanel = false;
    public string $currentValue = '';
    public string $newValue = '';
    public int $entityId = 0;
    public string $onSaveEventName = '';
    public string $onAbortEventName = '';
    public string $title = 'Edit Item';
    public string $label = 'Value';
    public string $placeholder = 'Enter new value...';

    #[On('show-edit-panel')]
    public function showEditPanel($label = '', $currentValue = '', $onSaveEventName = '', $onAbortEventName = ''): void
    {
        $this->showPanel = true;
        $this->label = $label ?? '';
        $this->currentValue = $currentValue ?? '';
        $this->onSaveEventName = $onSaveEventName ?? '';
        $this->onAbortEventName = $onAbortEventName ?? '';
    }

    #[On('hide-edit-panel')]
    public function hidePanel(): void
    {
        $this->showPanel = false;
        $this->reset(['currentValue', 'newValue', 'entityId', 'onSaveEventName', 'onAbortEventName']);
        $this->redirect(request()->header('Referer'));
    }

    public function save(): void
    {
        $this->validate([
            'newValue' => 'required|string|max:255',
        ]);

        if ($this->onSaveEventName) {
            $this->dispatch($this->onSaveEventName, [
                'id' => $this->entityId,
                'current' => $this->currentValue,
                'new' => $this->newValue,
            ]);
        }
        $this->hidePanel();
    }

    public function abort(): void
    {
        if ($this->onAbortEventName) {
            $this->dispatch($this->onAbortEventName);
        }
        $this->hidePanel(); 
    }

    public function render()
    {
        return view('livewire.edit-panel');
    }
}
