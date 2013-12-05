<?php
require_once("STDAL.php");

class DAL_Items extends STDAL
{
    public function __construct()
    {
		$this->tablename = "TestItem";
		$this->PrimaryKey = "Id";
		$this->criField = array("Id", "WebSite", "Description", "CreUser", "CreDate");
		
    }
    
    function DealDefaultData($obj, $isUpdate)
    {
        date_default_timezone_set('UTC');
        if($isUpdate)
        {
        }else{
            $obj->CreDate = date("Y-m-d H:i:s");
        }
    }
    
    function afterSave($obj, $isUpdate)
    {
        $updateObject = array();
        if($isUpdate)
        {
        }else{
						$updateObject = array();
            $updObj = new updateObject("CreDate", $obj->CreDate);
            array_push($updateObject, $updObj);
        }
        return $updateObject;
    }
}
?>