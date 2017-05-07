var React = {
	nextReactRootIndex: 0,
	render: function(element, container) {
		var componentInstance = instantiateReactComponent(element);
		var markup = componentInstance.mountComponent(React.nextReactRootIndex)
		$(container).html(markup);
		$(document).trigger('mountReady');
	},
	createElement: function(type, config, children) {
		var props = {},
			propName;
		config = config || {}
		var key = config.key || null;

		for (propName in config) {
			if (config.hasOwnProperty(propName) && propName !== 'key') {
				props[propName] = config[propName];
			}
		}

		var childrenLength = arguments.length - 2;
		if (childrenLength === 1) {
			props.children = $.isArray(children) ? children : [children];
		} else if (childrenLength > 1) {
			var childArray = Array(childrenLength);
			for (var i = 0; i < childrenLength; i++) {
				childArray[i] = arguments[i + 2];
			}
			props.children = childArray;
		}

		return new ReactElement(type, key, props);
	},
	createClass:function(spec){
		var Constructor = function(props){
			this.props = props;
			this.state = this.getInitialState?this.getInitialState():null;
		}
		Constructor.prototype = new ReactClass();
		Constructor.prototype.constructor = Constructor;
		$.extend(Constructor.prototype,spec); //将自定义的所有生命周期的函数merge进去
		return Constructor;
	}
}

function instantiateReactComponent(element) {
	if (typeof element === 'string' | typeof element === 'number') {
		return new ReactDOMTextComponent(element)
	}
	if(typeof element === 'object' && typeof element.type === 'string'){
		return new ReactDOMComponent(element)
	}
	if(typeof element === 'object' && typeof element.type === 'function'){
		return new ReactCompositeComponent(element);
	}
}

function ReactElement(type, key, props) {
	this.type = type;
	this.key = key;
	this.props = props;
}

function ReactClass(){

}

ReactClass.prototype.render = function(){}

/**
 * 文字元素处理
 */
function ReactDOMTextComponent(text) {
	this._currentElement = '' + text;
	this._rootNodeId = null;
}

ReactDOMTextComponent.prototype.mountComponent = function(rootId) {
	this._rootNodeId = rootId;
	return '<span data-reactid="' + rootId + '">' + this._currentElement + "</span>";
}


/**
 * element为 用createElement处理之后返回的  ReactElement 的实例，具有 type/key/props
 */
function ReactDOMComponent(element){
	this._currentElement = element;
	this._rootNodeId = null;
}

ReactDOMComponent.prototype.mountComponent = function(rootId){
	this._rootNodeId = rootId;
	var props = this._currentElement.props;
	var tagOpen = '<' + this._currentElement.type;
	var tagClose = '</' + this._currentElement.type + '>';

	tagOpen += ' data-reactid=' + this._rootNodeId;

	for(var propKey in props){
		if(/^on[A-Z]/.test(propKey)){
			//[改变  处理onClick事件]
			var eventType = propKey.replace(/on([A-Z])/,function(all,one){return one.toLowerCase()});
			$(document).delegate('[data-reactid="' + this._rootNodeId+'"]',eventType + '.' + this._rootNodeId,props[propKey] )
		}

		if(props[propKey] && propKey != 'children' && !/^on[A-Z]/.test(propKey)){
			tagOpen += ' ' + propKey + '=' + props[propKey];
		}
	}

	var content = '';
	var children = props.children || [];

	var childrenInstances = [];
	var that = this;
	$.each(children,function(key,child){
		//本质还是递归渲染所有子组件，并进行实例化

		//child 有 string，也有 ReactElement 实例化之后的
		var childComponentInstance = instantiateReactComponent(child);
		childComponentInstance._mountIndex = key;

		childrenInstances.push(childComponentInstance);
		var curRootId = that._rootNodeId + '.' + key;
		var childMarkup = childComponentInstance.mountComponent(curRootId);

		content += ' ' + childMarkup;
	})

	this._renderedChildren = childrenInstances;

	//拼接出所有内容
	return tagOpen + '>' + content + tagClose;
}

/**
 * element为 用createClass处理之后，再让createElement处理之后的，具有 type/key/props。
 * 其中type为 本身：带props,state；本身.prototype为自定义的生命周期函数，本身.prototype.ptototype为默认的声明周期函数(ReactClass上的)
 */

function ReactCompositeComponent(element){
	this._currentElement = element;
	this._rootNodeId = null;
	this._instance = null;
}

ReactCompositeComponent.prototype.mountComponent = function(rootId){
	this._rootNodeId = rootId;
	var publicProps = this._currentElement.props; //create穿进去的props
	var ReactClass = this._currentElement.type;
	var inst = new ReactClass(publicProps); //实例化props和state，还有原型链上的生命周期函数
	this._instance = inst; //与this.props、this.state同一级别

	//【更新预留】保留对当前component的引用，更新时会用到
	inst._reactInternalInstance = this;

	if(inst.componentWillMount){
		inst.componentWillMount();
	}

	var renderedElement = this._instance.render(); //为createElement返回的虚拟DOM节点
	var renderedComponentInstance = instantiateReactComponent(renderedElement);
	//【更新预留】
	this._renderedComponent = renderedComponentInstance;

	var renderedMarkup = renderedComponentInstance.mountComponent(this._rootNodeId);

	$(document).on('mountReady',function(){
		inst.componentDidMount &&inst.componentDidMount();
	})

	return renderedMarkup;

}

















