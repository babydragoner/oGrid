<?php

class column
{
	public $field;
	public $title;
	public $width;
	public $hidden;
	public $editor;
	public $sortable;
	
    function column($id, $caption)
    {
        $this->field = $id;
        $this->title = $caption;
        $this->width = "100px";
        $this->hidden = false;
        $this->sortable = false;
    }
}

class combo
{
	public $type;
	public $options;
    function combo()
    {
        $this->type = "combo";
        $this->options = array();
    }
}

class option
{
	public $id;
	public $text;
    function option($id, $text)
    {
        $this->id = $id;
        $this->text = $text;
    }
}

?>