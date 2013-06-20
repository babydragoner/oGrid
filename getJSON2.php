<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');

class customer
{
	public $Id;
	public $name;
	public $addr;
	public $phone;
}

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
echo json_encode($result); 

?>