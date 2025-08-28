<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Location;
use App\Models\Device;
use App\Models\Service;
use App\Models\Connection;
use App\Models\IPAddress;

class NetworkView extends Component
{
    public $locations;
    public $devices;
    public $services;
    public $connections;
    public $ipAddresses;

    public function mount()
    {
        $this->locations = Location::all();
        $this->devices = Device::all();
        $this->services = Service::all();
        $this->connections = Connection::all();
        $this->ipAddresses = IPAddress::all();
    }

    public function render()
    {
        return view('livewire.network-view');
    }
}