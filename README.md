AssetManager-Q
==============

Javascript Asset Manager using the [Q](https://github.com/kriskowal/q) promises library [UMD](https://github.com/umdjs/umd) compatible. This library is currently under development progress and the API and methods are likely to change in the near future.


## Example Code

  var assetManager = new AssetManager();
	var promise = assetManager
        .add([
            {id: "first", src: "images/first.png"},
            {id: "second", src: "images/second.gif"},
            {id: "third", src: "images/third.jpg"}
            ])
        .load();

  promise.then(function (assets) {
     console.log("assets loaded");
  });


#### TODO:

  * static methods default Instance method
  * multiple calls after load has been called?
  * timeout for images or assets not loaded
  * load assets other than image supported formats use XHR2 as in preloadjs?
  * cache flags for production make browser remembers the image for faster loading
  * Sequential Wrapper or sequential loader options with pause/resume
  * Events for asset manager start/loaded/total/fail
  * Events for each asset loaded start/progress/loaded/fail


#### Ideas

Cache layer storing on disk or localStorage for faster load especially for Projects where using PhoneGap and so on.
Perhaps own project, or extra AssetManager abstraction layer.
