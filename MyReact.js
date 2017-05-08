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

function _shouldUpdateReactComponent(prevElement, nextElement){
	if(prevElement != null && nextElement != null){
		var prevType = typeof PrevElement;
		var nextType = typeof nextElement;
		if(prevType === 'string' || prevType === 'number'){
			return nextType === 'string' || nextType === 'number';
		} else {
			return nextType === 'object' && prevElement.type === nextElement.type && prevElement.key === nextElement.key;
		}
	}
	return false;
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
ReactClass.prototype.setState = function(newState){
	this._reactInternalInstance.receiveComponent(null,newState)
}

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

ReactDOMTextComponent.prototype.receiveComponent = function(nextText) {
	var nextStringText = '' + nextText;
	if(nextStringText !== this._currentElement){
		this._currentElement = nextStringText;
		$('[data-reactid="' + this._rootNodeId + '"]').html(this._currentElement)
	}
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

	tagOpen += ' data-reactid="' + this._rootNodeId +'"';

	for(var propKey in props){
		if(/^on[A-Z]/.test(propKey)){
			//[改变  处理onClick事件]
			var eventType = propKey.replace(/on([A-Za-z]+)/,function(all,one){return one.toLowerCase()});
			$(document).delegate('[data-reactid="' + this._rootNodeId+'"]',eventType + '.' + this._rootNodeId, props[propKey] )
		}

		if(props[propKey] && propKey != 'children' && !/^on[A-Z]/.test(propKey)){
			tagOpen += ' ' + propKey + '=' + props[propKey];
		}
	}

	var content = '';
	var children = props.children || [];

	var childrenInstances = [];
	var that = this;
	if(that._rootNodeId===undefined){
		debugger;
	}
	$.each(children,function(key,child){
		//本质还是递归渲染所有子组件，并进行实例化

		//child 有 string，也有 ReactElement 实例化之后的
		var childComponentInstance = instantiateReactComponent(child);
		childComponentInstance._mountIndex = key;

		childrenInstances.push(childComponentInstance);
		if(that._rootNodeId===undefined){
			debugger;
		}
		var curRootId = that._rootNodeId + '.' + key;
		console.log('所有的rootid： ',curRootId)
		var childMarkup = childComponentInstance.mountComponent(curRootId);

		content += ' ' + childMarkup;
	})

	this._renderedChildren = childrenInstances;

	//拼接出所有内容
	return tagOpen + '>' + content + tagClose;
}

ReactDOMComponent.prototype.receiveComponent = function(nextElement){
	var lastProps = this._currentElement.props;
	var nextProps = nextElement.props;

	this._currentElement = nextElement;
	this._updateDOMProperties(lastProps,nextProps);
	this._updateDOMChildren(nextElement.props.children);
}

ReactDOMComponent.prototype._updateDOMProperties = function(lastProps, nextProps){
	var propKey;
	for(propKey in lastProps){
		if(nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey)){
			continue;
		}
		if(/^on[A-Z]/.test(propKey)){
			var eventType = propKey.replace(/on([A-Za-z]+)/,function(all,one){return one.toLowerCase()});
            $(document).undelegate('[data-reactid="' + this._rootNodeId + '"]', eventType, lastProps[propKey]);
            continue;
		}
		$('[data-reactid="' + this._rootNodeId + '"]').removeAttr(propKey)
	}

	for(propkey in nextProps){
		if(/^on[A-Z]/.test(propKey)){
			var eventType = propKey.replace(/on([A-Za-z]+)/,function(all,one){return one.toLowerCase()});
			lastProps[propKey] && $(document).undelegate('[data-reactid="' + this._rootNodeId + '"]', eventType, lastProps[propKey]);
			$(document).delegate('[data-reactid="' + this._rootNodeId + '"]',eventType + '.' + this._rootNodeId, nextProps[propKey]);
			continue;
		}
		if(propKey === 'children') continue;
		$('[data-reactid="' + this._rootNodeId + '"]').prop(propKey, nextProps[propKey])
	}

}

var updateDepth = 0;
var diffQueue = [];
ReactDOMComponent.prototype._updateDOMChildren = function(nextChildrenElements){
	updateDepth++;
	this._diff(diffQueue,nextChildrenElements);
	updateDepth--;
	if(updateDepth == 0){
		this._patch(diffQueue);
		diffQueue = [];
	}
}

/**
 * _diff和_patch逻辑
 */
var UPDATE_TYPES = {
	MOVE_EXISTING:1,
	REMOVE_NODE:2,
	INSERT_MARKUP:3
}

function flattenChildren(componentChildren){
	var child;
	var name;
	var childrenMap = {};
	for(var i = 0; i < componentChildren.length; i++){
		child = componentChildren[i];
		name = child && child._currentElement && child._currentElement.key ? child._currentElement.key : i.toString(36);
		childrenMap[name] = child;
	} 
	return childrenMap;
}

function generateComponentChildren(prevChildren, nextChildrenElements){
	var nextChildren = {};
	nextChildrenElements = nextChildrenElements || [];
	$.each(nextChildrenElements, function(index, element){
		//【bug 应该是element._currentElement.key吧？ 不是，这儿是this.props.children传进来的，为字符串，reactelement和reactclass三种最原始的可能】
		//而 prevChildren 是_renderedChildren传进来的，是实例化之后的
		var name = element.key ? element.key : index; 
		var prevChild = prevChildren && prevChildren[name];
		var prevElement = prevChild && prevChild._currentElement;
		var nextElement = element;

		if(_shouldUpdateReactComponent(prevElement, nextElement)){
			prevChild.receiveComponent(nextElement);
			nextChildren[name] = prevChild;
		} else {
			var nextChildInstance = instantiateReactComponent(nextElement,null)
			nextChildren[name] = nextChildInstance;
		}
	})

	return nextChildren;
}

ReactDOMComponent.prototype._diff = function(diffQueue, nextChildrenElements){
	var self = this;
	var prevChildren = flattenChildren(self._renderedChildren);
	var nextChildren = generateComponentChildren(prevChildren, nextChildrenElements);
	self._renderedChildren = []
	$.each(nextChildren, function(key, instance){
		self._renderedChildren.push(instance);
	})

	var lastIndex = 0;
	var nextIndex = 0;

	for(var name in nextChildren){
		if(!nextChildren.hasOwnProperty(name)){
			continue;
		}
		var prevChild = prevChildren && prevChildren[name];
		var nextChild = nextChildren[name];

		if(prevChild === nextChild){
			prevChild._mountIndex < lastIndex && diffQueue.push({
				parentId: self._rootNodeId,
				parentNode: $('[data-reactid="' + self._rootNodeId + '"]'),
				type: UPDATE_TYPES.MOVE_EXISTING,
				fromIndex: prevChild._mountIndex,
				toIndex: nextIndex
			})
			lastIndex = Math.max(prevChild._mountIndex, lastIndex);
		} else {
			if( prevChild ){
				diffQueue.push({
					type: UPDATE_TYPES.REMOVE_NODE,
					parentId: self._rootNodeId,
					parentNode:$('[data-reactid="' + self._rootNodeId + '"]'),
					fromIndex: prevChild._mountIndex,
					toIndex: null
				})

				if(prevChild._rootNodeId){
					$(document).undelegate('.' + prevChild._rootNodeId);
				}

				lastIndex = Math.max(prevChild._mountIndex, lastIndex);
			}

			diffQueue.push({
				parentId: self._rootNodeId,
				parentNode: $('[data-reactid="' + self._rootNodeId + '"]'),
				type:UPDATE_TYPES.INSERT_MARKUP,
				fromIndex:null,
				toIndex: nextIndex,
				markup: nextChild.mountComponent(self._rootNodeId + '.' + name)
			})
		}

		nextChild._mountIndex = nextIndex;
		nextIndex++;
	}

	for(var name in prevChildren){
		if(prevChildren.hasOwnProperty(name) && !(nextChildren && nextChildren.hasOwnProperty(name))){
			diffQueue.push({
				parentId: self._rootNodeId,
				parentNode: $('[data-reactid="' + self._rootNodeId + '"]'),
				type: UPDATE_TYPES.REMOVE_NODE,
				fromIndex: prevChildren[name]._mountIndex,
				toIndex: null
			})

			if(prevChildren[name]._rootNodeId){
				$(document).undelegate('.' + prevChildren[name]._rootNodeId);
			}
		}
	}
}

function insertChildAt(parentNode, childNode, index){
	var beforeChild = parentNode.children().get(index);
	beforeChild ? childNode.insertBefore(beforeChild) : childNode.appendTo(parentNode);
}

ReactDOMComponent.prototype._patch = function(updates){
	var update;
	var initialChildren = {};
	var deleteChildren = [];
	for(var i = 0; i < updates.length; i++){
		update = updates[i];
		if(update.type === UPDATE_TYPES.MOVE_EXISTING || update.type === UPDATE_TYPES.REMOVE_NODE){
			var updatedIndex = update.fromIndex;
			var updatedChild = $(update.parentNode.children().get(updatedIndex));
			var parentId = update.parentId;

			initialChildren[parentId] = initialChildren[parentId] || [];
			initialChildren[parentId][updatedIndex] = updatedChild;


			deleteChildren.push(updatedChild)
		}
	}

	$.each(deleteChildren, function(index, child){
		$(child).remove();
	})

	for(var k = 0; k < updates.length; k++){
		update = updates[k];
		switch(update.type){
			case UPDATE_TYPES.INSERT_MARKUP:
				insertChildAt(update.parentNode, $(update.markup), update.toIndex);
				break;
			case UPDATE_TYPES.MOVE_EXISTING:
				insertChildAt(update.parentNode, initialChildren[update.parentId][update.fromIndex], update.toIndex);
				break;
			case UPDATE_TYPES.REMOVE_NODE:
				break;
		}
	}
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

ReactCompositeComponent.prototype.receiveComponent = function(nextElement,newState){
	/**
	 * 它主要做了什么事呢？首先会合并改动，生成最新的state,props然后拿以前的render返回的element跟现在最新调用
	 * render生成的element进行对比（_shouldUpdateReactComponent），看看需不需要更新，
	 * 如果要更新就继续调用对应的component类对应的receiveComponent
	 */
	 //【这儿是类元素没有改变的逻辑 如果改变，不会走这一个，是直接instate，然后mount】
	this._currentElement = nextElement || this._currentElement; //用新的子节点更新子节点 都是createElement返回的内容，包括 ~.render()返回的

	var inst = this._instance;

	var nextState = $.extend(inst.state,newState);
	var nextProps = this._currentElement.props;

	if(inst.shouldComponentUpdate && (inst.shouldComponentUpdate(nextProps,nextSate) === false)) return;
	if(inst.componentWillUpdate) inst.componentWillUpdate(nextProps,nextState);

	inst.state = nextState;
	inst.props = nextProps;

	var prevComponentInstance = this._renderedComponent; //上次render返回的石磊，算是子节点了.
	var prevRenderedElement = prevComponentInstance._currentElement;

	var nextRenderedElement = this._instance.render();

	if(_shouldUpdateReactComponent(prevRenderedElement,nextRenderedElement)){
		prevComponentInstance.receiveComponent(nextRenderedElement)
		inst.componentDidUpdate && inst.componentDidUpdate();
	} else {
		var thisId = this._rootNodeId;
		var renderedComponent = instantiateReactComponent(nextRenderedElement);
		var nextMarkup = renderedComponent.mountComponent(thisId)
		this._renderedComponent = renderedComponent;

		$('[data-reactid="' + this._rootNodeId + '"]').replaceWith(nextMarkup);

	}
}

















