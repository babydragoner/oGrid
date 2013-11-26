<?php

class DB 
{
    var $_dbConn = 0;
    var $_queryResource = 0;
    var $dbname;
    
    function DB()
    {
        //do nothing
    }
    
    function connect_db($host, $user, $pwd, $fdbname)
    {
		$this->dbname = $fdbname;
        $dbConn = mysql_connect($host, $user, $pwd);
        if (! $dbConn)
            die ("MySQL Connect Error");
        mysql_query("SET NAMES utf8");
        if (! mysql_select_db($this->dbname, $dbConn))
            die ("MySQL Select DB Error");
        $this->_dbConn = $dbConn;
        return true;
    }
    
    function query($sql)
    {
        if (! $queryResource = mysql_query($sql, $this->_dbConn)){
			$msg = $this->get_Error();
            return get_class($this)."->query : $msg, $sql";
		}else{
			$this->_queryResource = $queryResource;
			return "true";
		}
    }
    
    /** Get array return by MySQL */
    function fetch_array()
    {
        return mysql_fetch_array($this->_queryResource, MYSQL_ASSOC);
    }
    function fetch_assoc()
    {
        return mysql_fetch_assoc($this->_queryResource);
    }
    function fetch_object()
    {
        return mysql_fetch_object($this->_queryResource, MYSQL_ASSOC);
    }
    function get_num_rows()
    {
        return mysql_num_rows($this->_queryResource);
    }

    /** Get the cuurent id */    
    function get_insert_id()
    {
        return mysql_insert_id($this->_dbConn);
    } 
    
    /** Get the Error Msg, or '' (empty string) if no error occurred. */    
    function get_Error()
    {
        return mysql_error($this->_dbConn);
    } 
    
    /** Get the Error Msg, or '' (empty string) if no error occurred. */    
    function get_Fields($tablename)
    {
		$res = mysql_list_fields($this->dbname, $tablename, $this->_dbConn);
		if($res > 0)
		{
			$items = array();

			$i = 0;
			$length = $field = mysql_num_fields( $res );
			while ($i < $length) {
				$field = mysql_field_name($res, $i++);
				array_push($items, $field); 
			}
			
			return $items;
		}else
        	return $phperrmsg;
    } 
}
?>