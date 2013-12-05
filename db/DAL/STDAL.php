<?php
require_once("IDAL.php");

class DALFactory
{
    public static function getInstance($prgName) {
		//require_once("$prgName.php");
		$CONFIG_DIR = "/home/a7091930/public_html/samples/";
		require_once($CONFIG_DIR."/db/DAL//$prgName.php");

		$class = "DAL_$prgName";
		return new $class;
    }
}

class STDAL implements IDAL
{
	var $db;
	public $tablename;
	public $PrimaryKey;
	
	public $ForeignTable;
	public $Foreignkey;
	var $criField;
		
    public function __construct()
    {
		
    }
    function afterSave($obj, $isUpdate)
    {
      $updateObject = array();
      return $updateObject;
    }
    function CheckData($obj, $isUpdate)
    {
      $this->DealDefaultData($obj, $isUpdate);
      return true;
    }
    function DealDefaultData($obj, $isUpdate)
    {
    }
    
    /** del row */
    function setDB($fdb)
    {
		$this->db = $fdb;
    }
    
    
    function delete($id)
    {
		$sql = "delete from $this->tablename where $this->PrimaryKey=$id";
        return $this->db->query($sql);
    }
    
    
    function update($obj)
    {
    $this->CheckData($obj, true);
		$prop = $this->PrimaryKey;
		$PK = $obj->$prop;
		//$PK = $_REQUEST[$this->PrimaryKey];
		$fields = $this->db->get_Fields($this->tablename);
		$fcount = count($fields);
		$set = "";
		$f;
		for ($i = 0; $i < $fcount; $i++) {
			if($fields[$i] != $this->PrimaryKey)
			{
				$f = $fields[$i];
				$var = $obj->$f;
				if (!empty($var) ) {
					if($set != "")
						$set .= ",";
					$set .= $f."='".$var."'";
				}
			}
		}

		$sql = "update $this->tablename set $set where $this->PrimaryKey=$PK";
        $res = $this->db->query($sql);
        if($res == "true")
        	return $res;
        else
        	return get_class($this)."->".__FUNCTION__." at ".__LINE__." => $res";
        	//return get_class($this)."->".__FUNCTION__." in ".__FILE__." at ".__LINE__."=>$res";
    }
    
    
    function insert($obj)
    {
    $this->CheckData($obj, false);
		$fields = $this->db->get_Fields($this->tablename);
		$fcount = count($fields);
		$set = "";
		$val = "";
		$f;
		for ($i = 0; $i < $fcount; $i++) {
			if($fields[$i] != $this->PrimaryKey)
			{
				$f = $fields[$i];
				$var = $obj->$f;
				if (!empty($var) ) {
					if($set != ""){
						$set .= ",";
						$val .= ",";
					}
					$set .= $f;
					$val .= "'".$var."'";
				}
			}
		}
		
		$sql = "insert into $this->tablename ($set) values($val)";
        $res = $this->db->query($sql);
        if($res == "true")
        	return $res;
        else
        	return get_class($this)."->".__FUNCTION__." at ".__LINE__." => $res";
    }
    function IU_Validate($criValues)
    {
		return true;
    }
    
    /** del row */
    function getTotalCount()
    {
		$this->db->query("select count(*) As Total from $this->tablename");
        $row = $this->db->fetch_assoc();
        return $row["Total"];
    }
    
    function getMainSQL()
    {
		$sql = "select * from $this->tablename";
		return $sql;
    }
    
    
    function getData($criValues)
    {
		$page = isset($_POST['page']) ? intval($_POST['page']) : 1;  
		$rows = isset($_POST['rows']) ? intval($_POST['rows']) : 10;
		$sort = isset($_POST['sort']) ? strval($_POST['sort']) : $this->PrimaryKey;
		$order = isset($_POST['order']) ? strval($_POST['order']) : 'asc';
		$offset = ($page-1)*$rows;
		
		$sql = $this->getMainSQL();
		$where = "";
		
		$fcount = count($this->criField);
		$f;
		for ($i = 0; $i < $fcount; $i++) {
			$f = $this->criField[$i];
			
			if (!empty($criValues[$f]) && $criValues[$f] != "") {
				if($where != "")
					$where .= " And ";
					
				if(!empty($this->Foreignkey) && $this->Foreignkey == $f){
					$where = " $this->tablename.$f = '".$criValues[$f]."'";
				}else
					$where = " $this->tablename.$f like '".$criValues[$f]."'";
					//$where = " CardCode = 'test'";
			}
		}
		
		if($where != "")
		{
			$where = " Where ".$where;
		}
		if($sort != "")
		{
			$sort = "$this->tablename.$sort";
		}
		
		//$where = " WHERE STUID LIKE '%f%' AND Nickname LIKE '%a%'";
		
		$sql = $sql.$where." Order By $sort $order limit $offset,$rows";
        $res = $this->db->query($sql);
        if($res == "true"){
			$items = array();  
			while($row = $this->db->fetch_assoc()){  
				array_push($items, $row);  
			}
			return $items;
		}else{
        	return get_class($this)."->".__FUNCTION__." at ".__LINE__." => $res";
		}
    }
}
?>