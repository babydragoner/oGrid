/*
* oGrid for pure javascript -  v0.5.1
*
* Copyright (c) 2013 watson chen (code.google.com/p/obj4u/)
* Dual licensed under the GPL Version 3 licenses.
*
*/
var obj4u = obj4u || {};
obj4u.oGrid = oGrid;
obj4u.EventContorller = EventContorller;
obj4u.Clone = Clone;
obj4u.HadValue = HadValue;
function oGrid(fcontainer, params) {
    this.container = fcontainer;
    this.totalRow;
    this.rows = [];
    this.columns = [];
    this.editors = {};
    this.loadUrl;
    this.reloadPage = true;
    this.showNavigation = true;
    this.multiSelect = true;
    this.lastSelectedItem;
    this.lastSelectedIndex;
    this.totalPage;
    this.pageNames = ['First', 'Previous', 'Next', 'Last']
    this.pageNumber = 0;
    this.pageSize = 10;
    this.event = new obj4u.EventContorller(this);

    if (!this.container.className) {
        this.container.className = "oGrid";
    }
    
    if (params) {
        if (params.loadUrl) {
            this.loadUrl = params.loadUrl;
        }
        if (params.columns) {
            this.columns = params.columns;
        }
    }

    this.addColumn = function (col) {
        this.columns[this.columns.length] = col;
        return col;
    }
    this.addRows = function (rowData) {
        if (typeof rowData == 'object') {
            if (!rowData.length) {
                this.setRow(rowData);
                this.totalRow++;
            } else {
                for (var i = 0; i < rowData.length; ++i) {
                    this.setRow(rowData[i]);
                    this.totalRow++;
                }
            }
        }
    }
    function addPageCilckEvent(obj, control, pageNum) {
        control.addEventListener("click",
                         function () {
                             obj.changePageNumber(pageNum);
                         },
                         false);
    }
    this.acceptChanges = function (dataIndex) {
        if (obj4u.HadValue(dataIndex)) {
            var rowElement = document.getElementById("row" + dataIndex);
            var row = this.rows[dataIndex];
            for (var i in rowElement.children) {
                var cell = rowElement.children[i];
                if (cell.editor) {
                    var val = cell.editor.getValue(cell.editor.control);
                    row[cell.field] = val;
                }
            }
            this.editRow(dataIndex, false);
        }
    }

    this.changePageNumber = function (pageNum) {
        if (pageNum > this.totalPage)
            pageNum = 0;
        this.pageNumber = pageNum;
        var params = {};
        params.page = this.pageNumber;
        params.rows = this.pageSize;
        if (this.loadUrl) {
            if (!this.reloadPage) {
                var start = this.pageNumber * this.pageSize;
                if (!this.rows[start]) {
                    this.load("data", params);
                }
            } else
                this.load("data", params);
        }

        this.renderData();
    }

    this.editRow = function (dataIndex, isEdit) {
        if (obj4u.HadValue(dataIndex)) {
            var rowElement = document.getElementById("row" + dataIndex);
            var row = this.rows[dataIndex];
            if (isEdit) {
                if (!row.edit) {
                    if (!row.selected) {
                        this.selectRow(rowElement);
                    }
                    row.edit = true;
                    if (rowElement) {
                        this.renderRow(rowElement, row);
                    }
                }
            } else {
                row.edit = false;
                if (rowElement) {
                    this.unselectedRow(rowElement, row);
                    this.renderRow(rowElement, row);
                }
                //this.onAfterEdit(row);
            }            
        }
    }

    this.getColumn = function (field) {
        var col = null;
        if (!field) {
            this.onLog("field is empty.");
            return col;
        }
        for (var i = 0; i < this.columns.length; ++i) {
            if (this.columns[i].field == field) {
                col = this.columns[i];
                break;
            }
        }
        if (!col) {
            this.onLog(field + " column was ont found.");
            return col;
        }
        return col;
    }
    this.getSelectRows = function () {
        var selectRows = [];
        for (var i = 0; i < this.rows.length; ++i) {
            if (this.rows[i].selected) {
                selectRows[selectRows.length] = this.rows[i];
            }
        }
        return selectRows;
    }
    this.getDefaultColumn = function () {
        var col = [];
        col.field = "";
        col.title = "";
        col.width = "100px";
        col.colspan = 1;
        col.rowspan = 1;
        col.hidden = false;
        col.sortable = true;
        col.order = "desc";
        col.formatter = null;
        col.styler = null;
        col.editor = null;
        return col;
    }
    this.getBlankRow = function () {
        var obj = this.rows[0];
        var temp = obj.constructor();
        for (var key in obj) {
            if (typeof (obj[key]) == 'boolean')
                temp[key] = false;
            else if (typeof (obj[key]) == 'number')
                temp[key] = 0;
            else
                temp[key] = '';
        }
        return temp;
    }

    this.insertRow = function (dataIndex, row) {
        if (!obj4u.HadValue(dataIndex))
            rowIndex = 0;
        if (!row) {
            row = this.getBlankRow();
        }
        this.rows.splice(dataIndex, 0, row);
        this.totalRow++;
        this.resetRowIndex();
        return row;
    }
    this.insertRowElement = function (isNormal) {
        var rowElement = this.container.insertRow(this.container.rows.length);
        if (isNormal) {
            var obj = this;
            rowElement.addEventListener("click",
                             function () {
                                 obj.selectRow(this, "click");
                             },
                             false);
            rowElement.addEventListener("dblclick",
                             function () {
                                 obj.selectRow(this, "dblclick");
                             },
                             false);
            if (rowElement.rowIndex % 2 == 1)
                rowElement.className = "datarowodd";
            else
                rowElement.className = "dataroweven";
        }
        return rowElement;
    }
    this.insertCell = function (rowElement) {
        var cellElement = rowElement.insertCell(rowElement.cells.length);
        return cellElement;
    }

    this.loadData = function (jsonData) {
        if (!jsonData) {
            this.onLog("jsonData is empty.");
            return;
        }
        if (!jsonData.rows) {
            this.onLog("jsonData rows is empty.");
            return;
        }
        if (jsonData.rows.length <= 0) {
            this.onLog("jsonData length <= 0.");
            return;
        }

        if (jsonData.total)
            this.totalRow = jsonData.total;
        else
            this.totalRow = jsonData.rows.length;

        if (jsonData.columns) {
            this.columns = jsonData.columns;
        }

        if (this.columns.length <= 0) {
            for (var p in jsonData.rows[0]) {
                if (p != "rowStyle" && p != "cellStyle") {
                    var col = this.getDefaultColumn();
                    col.field = p;
                    col.title = p;
                    this.addColumn(col);
                }
            }
        }
        var start = this.pageNumber * this.pageSize;
        var last = start + this.pageSize;
        if (last > start + jsonData.rows.length)
            last = start + jsonData.rows.length;
        if (start == 0) {
            last = jsonData.rows.length;
        }

        var z = 0;
        for (var i = start; i < last; ++i) {
            var oldRow = this.rows[i];
            //this.rows[i] = jsonData.rows[z];
            this.setRow(jsonData.rows[z], i);
            this.rows[i].index = i;
            if (oldRow) {
                this.rows[i].selected = oldRow.selected;
            }

            z++;
        }
    }
    this.loadFromUrl = function (url, type, async, filter, queryParams) {
        var xmlhttp;
        if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        } else {// code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        var obj = this;
        xmlhttp.onreadystatechange = function () {

            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

                var data;
                var ct = xmlhttp.getResponseHeader("content-type"),
		                xml = type == "xml" || !type && ct && ct.indexOf("xml") >= 0,
		                data = xml ? xmlhttp.responseXML : xmlhttp.responseText;

                if (filter)
                    data = filter(data, type);

                //if ( type.toLowerCase() == "script" )
                //jQuery.globalEval( data );

                data = obj.onLoadSuccess(data, type);
                // Get the JavaScript object, if JSON is used.
                if (type.toLowerCase() == "json")
                    data = eval("(" + data + ")");

                obj.loadData(data);
            }
        }

        xmlhttp.open("POST", url, async);
        var qry = "";
        if (queryParams) {
            for (var p in queryParams) {
                if (qry.length > 0)
                    qry += "&";
                qry += p + "=" + queryParams[p];
            }
        }
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.send(qry);
    }
    this.load = function (type, queryParams) {
        if (!this.loadUrl) {
            this.onLog("loadUrl is empty.");
            return;
        }

        var furl = this.loadUrl;
        if (type) {
            furl = furl + "?type=" + type;
        } else {
            furl = furl + "?type=init";
        }

        obj.loadFromUrl(furl, 'json', false, null, queryParams);
    }

    this.renderCell = function (rowElement, row, col) {
        if (col.hidden) {
            return;
        }
        var cell = this.insertCell(rowElement);
        if (!col.field) {
            this.onLog("col.field is empty.");
            return;
        }
        cell.field = col.field;

        cell.id = rowElement.id + cell.field;
        if (col.width)
            cell.width = col.width;

        var colValue = row[col.field];

        var editor;
        if (col.editor) {
            if (col.editor) {
                if (typeof (col.editor) == 'string') {
                    editor = new this.editors[col.editor];
                } else if (col.editor.type) {
                    editor = new this.editors[col.editor.type];
                }
            }
        }

        if (row.edit && row.selected) {
            if (editor) {
                if (editor.init) {
                    editor.control = editor.init(cell, col.editor.options);
                    editor.setValue(editor.control, colValue);
                    cell.editor = editor;
                }
            }
        } else {
            if (!colValue)
                colValue = '';
            else if (editor) {
                if (editor.getText) {
                    colValue = editor.getText(colValue, col.editor.options);
                }
            }

            cell.innerHTML = "&nbsp;" + colValue;
            if (row.cellStyle) {
                if (!row.cellStyle.length) {
                    this.setCellStyle(cell, row.cellStyle);
                } else {
                    for (var i = 0; i < row.cellStyle.length; ++i) {
                        this.setCellStyle(cell, row.cellStyle[i]);
                    }
                }
            }
        }
        return cell;
    }
    this.renderData = function () {
        this.container.innerHTML = "";
        if (!this.showNavigation) {
            this.pageSize = this.totalRow;
        }

        this.totalPage = Math.ceil(this.totalRow / this.pageSize);
        if (this.pageNumber > this.totalPage || this.pageNumber < 0)
            this.pageNumber = 0;

        if (this.showNavigation) {
            var rowElement = this.insertRowElement(false);
            this.renderNavigationHead(rowElement);
        }
        this.renderRowHead();
        var start = this.pageNumber * this.pageSize;
        var last = start + this.pageSize;
        if (last > this.totalRow)
            last = this.totalRow;

        for (var i = start; i < last; ++i) {
            rowElement = this.insertRowElement(true);
            var row = this.rows[i];
            rowElement.id = "row"+i;
            rowElement.dataIndex = i;
            this.renderRow(rowElement, row);
        }

        if (this.showNavigation) {
            rowElement = this.insertRowElement(false);
            this.renderNavigationFooter(rowElement);
        }
    }
    this.renderRowHead = function () {
        var thead = document.createElement("thead");
        thead.className = "headerrow";
        for (var i = 0; i < this.columns.length; ++i) {
            if (this.columns[i].hidden) {
                continue;
            }
            var th = document.createElement("th");
            th.innerHTML = "&nbsp;" + this.columns[i].title;
            thead.appendChild(th);
        }
        this.container.appendChild(thead);
    }
    this.renderNavigationHead = function (rowElement) {
        //this.renderNavigationBar(rowElement);
    }
    this.renderNavigationFooter = function (rowElement) {
        this.renderNavigationBar(rowElement);
    }
    this.renderNavigationBar = function (rowElement) {
        var td = document.createElement("td");
        td.setAttribute("colspan", this.columns.length);
        var div = document.createElement("div");
        div.className = "pagination";
        var ul = document.createElement("ul");
        var li, li2;
        li = document.createElement("li");
        li.innerHTML = this.pageNames[0];
        if (this.pageNumber == 0) {
            li.className = "disabled";
        } else {
            li.className = "normal";
            addPageCilckEvent(this, li, 0);
        }
        ul.appendChild(li);
        li = document.createElement("li");
        li.innerHTML = this.pageNames[1];
        if (this.pageNumber == 0) {
            li.className = "disabled";
        } else {
            li.className = "normal";
            addPageCilckEvent(this, li, this.pageNumber - 1);
        }
        ul.appendChild(li);

        for (var i = 0; i < this.totalPage; ++i) {
            li = document.createElement("li");
            li.innerHTML = i + 1;
            if (i == this.pageNumber) {
                li.className = "current";
            } else {
                li.className = "normal";
            }

            addPageCilckEvent(this, li, i);
            ul.appendChild(li);
        }

        li = document.createElement("li");
        li.innerHTML = this.pageNames[2];
        if (this.pageNumber == this.totalPage-1) {
            li.className = "disabled";
        } else {
            li.className = "normal";
            addPageCilckEvent(this, li, this.pageNumber + 1);
        }
        ul.appendChild(li);

        li = document.createElement("li");
        li.innerHTML = this.pageNames[3];
        if (this.pageNumber == this.totalPage-1) {
            li.className = "disabled";
        } else {
            li.className = "normal";
            addPageCilckEvent(this, li, this.totalPage-1);
        }
        ul.appendChild(li);

        div.appendChild(ul);
        td.appendChild(div);
        rowElement.appendChild(td);
    }
    this.renderRow = function (rowElement, row) {
        if (!row) {
            this.onLog("row is empty.");
            return;
        }
        if (row.rowStyle) {
            if (row.rowStyle.className) {
                rowElement.className = row.rowStyle.className;
            } else {
                rowElement.setAttribute("style", row.rowStyle.style);
            }
        }
        if (row.selected && rowElement.className != "selected") {
            this.setSelectedRow(rowElement, row);
        }
        rowElement.innerHTML = "";
        for (var i = 0; i < this.columns.length; ++i) {
            this.renderCell(rowElement, row, this.columns[i]);
        }
    }
    this.removeRow = function (dataIndex) {
        if (obj4u.HadValue(dataIndex)) {
            this.rows.splice(dataIndex, 1);
            this.totalRow--;
            this.resetRowIndex();
        }
    }
    this.resetRowIndex = function () {
        for (var i = 0; i < this.rows.length; ++i) {
            this.rows[i].index = i;
        }
    }

    this.selectRow = function (rowElement, type) {
        var i = rowElement.dataIndex;
        if (!this.rows[i].selected) {
            var flag = true;
            if (this.lastSelectedItem && !this.multiSelect) {
                flag = !this.rows[this.lastSelectedItem.dataIndex].edit;
                this.unselectedRow(this.lastSelectedItem, this.rows[this.lastSelectedItem.dataIndex]);
            }
            if (flag) {
                //this.lastSelectedItem = rowElement;
                //this.lastSelectedIndex = i;
                //this.rows[i].selected = true;
                //rowElement.oldClassName = rowElement.className;
                //rowElement.className = "selected";
                this.setSelectedRow(rowElement, this.rows[i]);
                if (type)
                    this.onSelectedRow(rowElement, this.rows[i]);
            }
        } else {
            this.unselectedRow(rowElement, this.rows[i]);
        }
        if (type == "click")
            this.onClickedRow(rowElement, this.rows[i]);
        else if (type == "dblclick")
            this.onDblClickedRow(rowElement, this.rows[i]);
    }
    this.setCellStyle = function (cell, cellStyle) {
        if (cell.field == cellStyle.field) {
            if (cellStyle.className) {
                cell.className = cellStyle.className;
            } else {
                cell.setAttribute("style", cellStyle.style);
            }
        }
    }
    this.setRow = function (rowData, dataIndex) {
        if (typeof rowData == 'object') {
            if (!obj4u.HadValue(dataIndex))
                dataIndex = this.rows.length;
            this.rows[dataIndex] = obj4u.Clone(rowData);
            this.rows[dataIndex].origin = obj4u.Clone(rowData);
        }
    }
    this.setSelectedRow = function (rowElement, row) {
        this.lastSelectedItem = rowElement;
        this.lastSelectedIndex = row.index;
        row.selected = true;
        rowElement.oldClassName = rowElement.className;
        rowElement.className = "selected";
    }

    this.updateColumn = function (col) {
        if (!col) {
            this.onLog("col is empty.");
            return;
        }
        if (!col.field) {
            this.onLog("col.field is empty.");
            return;
        }
        for (var i = 0; i < this.columns.length; ++i) {
            if (this.columns[i].field == col.field) {
                this.columns[i] = col;
                break;
            }
        }
        this.columns[this.columns.length] = col;
        return col;
    }
    this.unselectedRow = function (rowElement, row) {
        if (!row.edit) {
            this.lastSelectedItem = null;
            this.lastSelectedIndex = null;
            row.selected = false;
            if(rowElement)
                rowElement.className = rowElement.oldClassName;
        }
    }

    this.onAfterEdit = function (row, oriRow) {
    }
    this.onLog = function (msg) {
    }
    this.onLoadSuccess = function (data, type) {
        return data;
    }
    this.onDblClickedRow = function (rowElement, row) {
    }
    this.onClickedRow = function (rowElement, row) {
    }
    this.onSelectedRow = function (rowElement, row) {
    }
    this.onUnselectedRow = function (rowElement, row) {
    }
};

function EventContorller(fcontrol) {
    var control = fcontrol;

    this.AddEvent = function (eventName, eventObject) {
        var event = control[eventName];
        if (event)
            control[eventName] = eventObject;
    }
    this.removeEvent = function (eventName) {
        var event = control[eventName];

        if (event)
            control[eventName] = function (){};
    }
}

function Clone(obj) {
    if (obj == null || typeof (obj) != 'object')
        return obj;

    var temp = obj.constructor(); // changed

    for (var key in obj)
        temp[key] = Clone(obj[key]);
    return temp;
}

function HadValue(obj) {
    if (obj == null || typeof (obj) == 'undefined')
        return false;
    else
        return true;
}