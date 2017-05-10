包括两个方面：
- 初次渲染
三个基本组件类， ReactDOMTextComponent/ReactDOMComponent/ReactCompositeComponent   
所有都用 React.createElement 进行初始化，包括 React.createClass 生成的组件。   
用instantiateReactComponent实例化，用mountComponent挂载(每个类只关心自己的)

- 进行更新
用setState => 及各个类上的 receiveComponent 更新   
其中包括三个关键方法 _shouldUpdateReactComponent 、_diff 、 _patch。     
_shouldUpdateReactComponent用来判断是否是相同的组件，从而判断是修改还是重新mount.   
_diff核心算法，判断改变的节点。所有的。并存在 diffQueue 中。    
_patch，在用 _diff 收集完所有改变后，用这个方法进行改变。   
