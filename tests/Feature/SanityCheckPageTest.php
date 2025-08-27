<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Livewire\SanityCheck;

class SanityCheckPageTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_sanity_check_page_is_rendered_correctly(): void
    {
        $this->get('/sanity-check')
            ->assertStatus(200)
            ->assertSeeLivewire(SanityCheck::class);
    }

    public function test_the_root_url_redirects_to_the_sanity_check_page(): void
    {
        $this->get('/')
            ->assertRedirect('/sanity-check');
    }
}
