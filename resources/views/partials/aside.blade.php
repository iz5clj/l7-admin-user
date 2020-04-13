{{-- Tip 1: You can change the color of the sidebar using: data-color="purple | blue | green | orange | red" --}}
{{-- Tip 2: you can also add an image using data-image tag --}}
<div class="sidebar" data-color="blue" data-image="/assets/images/sidebar/sidebar-1.jpg">
    <div class="sidebar-wrapper">
        <div class="logo">
            <a href="https://auxe.net" class="simple-text">
                Auxe
            </a>
        </div>
        <ul class="nav">
            <li class="nav-item active">
                <a class="nav-link" href="{{ route('dashboard') }}">
                    <span class="material-icons mr-1" style="vertical-align: middle;">dashboard</span>
                    <p>Dashboard</p>
                </a>
            </li>
            <li>
                <a class="nav-link" href="#">
                    <span class="material-icons mr-1" style="vertical-align: middle;">person</span>
                    <p>User Profile</p>
                </a>
            </li>
            <li>
                <a class="nav-link" href="{{ route('info') }}">
                    <span class="material-icons mr-1" style="vertical-align: middle;">settings</span>
                    <p>System</p>
                </a>
            </li>
            <li class="nav-item active active-pro">
                <a class="nav-link active" href="#">
                    <i class="nc-icon nc-alien-33"></i>
                    <p>Always at bottom</p>
                </a>
            </li>
        </ul>
    </div>
</div>