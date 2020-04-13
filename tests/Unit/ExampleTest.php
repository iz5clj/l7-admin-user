<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use Parsedown;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     *
     * @return void
     */
    public function testBasicTest()
    {
        // dd("Michel");
        // $this->assertTrue(true);
        $parsedown = new Parsedown();
        dd($parsedown->text('# Heading one'));
    }
}
