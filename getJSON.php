<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');

class column
{
	public $field;
	public $title;
	public $width;
	public $hidden;
	
    function column($id, $caption)
    {
        $this->field = $id;
        $this->title = $caption;
        $this->width = "100px";
        $this->hidden = false;
    }
}
class customer
{
	public $Id;
	public $name;
	public $addr;
	public $phone;
}
$type = $_GET["type"];;
$page = isset($_POST['page']) ? intval($_POST['page']) : 0; 
$rows = isset($_POST['rows']) ? intval($_POST['rows']) : 10; 

$start = $page * $rows + 1;
$last = $start + $rows;
$items = array();  
for($i=$start;$i< $last;$i++){
	$obj = new customer();
	$obj->Id = $i;
	$obj->name = "test".$i;
	$obj->addr = "address - ".$i;
	$obj->phone = "P".$i;
	array_push($items, $obj); 
}
$result["total"] = 30;
$result["rows"] = $items;


if($type == "init")
{
	$columns = array();
	$col = new column("Id", "code");
	array_push($columns, $col);
	$col = new column("name", "name");
	array_push($columns, $col);
	$col = new column("addr", "address");
	array_push($columns, $col);
	$col = new column("phone", "phone");
	array_push($columns, $col);
	$result["columns"] = $columns;
}

echo json_encode($result); 

?>