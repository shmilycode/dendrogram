(function(){
dataset = {
//向php服务发送请求
//sendMsg为请求包
//callback为返回回调函数
xmlHttpSend: function(sendMsg, callback){
	var error_callback = arguments[2] || function(e){
		console.debug(e);
		console.debug("Problem retrieving XML data");
	};
	var xmlHttp = new XMLHttpRequest();
	var serverAddr = "http://120.27.110.28/chrome.php";
	xmlHttp.open("POST", serverAddr, true);
	xmlHttp.setRequestHeader("Content-Type",
		"application/x-www-form-urlencoded");
	xmlHttp.onreadystatechange = function(){
		if(xmlHttp.readyState == 4)
		{
			if(xmlHttp.status == 200){
				var text = xmlHttp.responseText;
				//将JSON串转化为数组
				if (text)
					text = JSON.parse(text);
				callback(text.result);
				
			}
			else
				error_callback();
		}	
	};

	var reg = new RegExp("&", "g");
	sendMsg = encodeURIComponent(sendMsg);
	try{
		xmlHttp.send("json="+sendMsg);
	}catch(e){
		error_callback(e);
	}
},

//获取数据库数据
queryAll: function(callback){
	var sendMsg = {};
	sendMsg["from"] = "chrome";
	sendMsg["object"] = "database";
	sendMsg["option"] = "query";
	var strSendMsg = JSON.stringify(sendMsg);
	var res =  dataset.xmlHttpSend(strSendMsg, callback);
},

//获取指定ip的数据
queryByIp: function(ip, callback){
	var sendMsg = {};
	sendMsg["from"] = "chrome";
	sendMsg["object"] = "database";
	sendMsg["option"] = "queryByIp";
	sendMsg["data"]  = {};
	sendMsg["data"]["ip"] = ip;
	var strSendMsg = JSON.stringify(sendMsg);
	var res =  dataset.xmlHttpSend(strSendMsg, callback);
},

//对数据进行统计
//生成JSON格式的统计结果
//结果中包括from，to
//将数据库中的数据转化为结点数据
getNodes: function(data){
	var nodes = {};
	var root = {};

	root[""] = {url:""};
	data.forEach(function(d){
		dataset.getSingleNode(d.url, d, nodes);
	});
	root[""].children = [];
	root[""].name = "root";
	for(var url in nodes){
		if(!nodes[url].parent){
			root[""].children.push(
				nodes[url]);
			//为每一个结点提供一个id
			nodes[url].parent = root[""];
		}
	}
	var allNodes = [];
	allNodes.push(root[""]);
	var id = 1;
	for(var url in nodes){
		allNodes.push(nodes[url]);
		//为每一个结点提供一个id
		nodes[url].name = "node_" + id.toString();
		id++;
	}
//	nodes.push(root);
	
	return root[""];
},

//将每一个Url信息返回一个结点
getSingleNode: function(url, data, nodes){
	if(!url)
		return;
	var single_node = nodes[url];
	if(!single_node){
			single_node = nodes[url] = {url: url};
			single_node['opInfo'] = [];
	}
	if(data && data.opInfo)
		single_node['opInfo'].push(data.opInfo);
	if(data && data.nextUrl){
		var nextNode = dataset.getSingleNode(
			data.nextUrl, null, nodes);

		if(!single_node['children']){
			single_node['children']=[];
		}

		//防止重复添加相同的子树
		var children = single_node['children'];
		var childExist = false;
		for(var child in children){
			if(children[child] == nextNode){
				childExist = true;
				break;
			}
		}
		if(childExist == false && !nextNode.parent){
			single_node['children'].push(nextNode);
			nextNode['parent'] = single_node;
		}
	}
	return single_node;
},

//将数据库化为结点间的连接
//连接数据必须包括
//source和target字段
getLinks: function(nodes){
	var map = {};
	var links = [];
	nodes.forEach(function(d){
		map[d.url] = d;
	});

	nodes.forEach(function(d){
		var nxnodes = d.nextNodes;
		if(nxnodes){
			nxnodes.forEach(function(nextNode){
				links.push({source: map[d.url], 
					    target: map[nextNode.url]});
			});
		}
	});
	return links;
},


//颜色	
color: d3.scale.ordinal()
	.range(['#EF3B39', '#FFCD05', '#69C9CA', '#666699', '#CC3366', 
	'#0099CC','#CCCB31', '#009966', '#C1272D', '#F79420', '#445CA9', 
	'#999999','#402312', '#272361', '#A67C52', '#016735', '#F1AAAF', 
	'#FBF5A2','#A0E6DA', '#C9A8E2', '#F190AC', '#7BD2EA', '#DBD6B6', 
	'#6FE4D0']),
//将颜色和data建立离散域
fixate_colors: function(data){
	dataset.color.domain(function(data){
		return data.x;});
},
};})();
