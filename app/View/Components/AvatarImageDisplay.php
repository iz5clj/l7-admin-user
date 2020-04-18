<?php

namespace App\View\Components;

use App\User;
use Illuminate\View\Component;
use Illuminate\Support\Facades\Storage;

class AvatarImageDisplay extends Component
{
    /**
     * The autheticated user's 
     * 
     */
    public $user;

    public $image;
    public $name;

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct(User $user)
    {
        $this->image  = Storage::disk('avatar')->url($user->avatar);
        $this->name = $user->name;
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\View\View|string
     */
    public function render()
    {
        return view('components.avatar-image-display');
    }
}
