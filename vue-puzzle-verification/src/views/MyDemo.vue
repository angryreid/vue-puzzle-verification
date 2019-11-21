<template>
  <div ref="validate_box">
    <div ref="tncode_start" class="this" style="text-align: center;margin: 100px auto;"></div>
    <div class="this_div_bg" id="this_div_bg"></div>
    <div class="this_div" id="this_div">
      <div class="loading">加载中</div>
      <canvas ref="this_canvas_bg" class="this_canvas_bg"></canvas>
      <canvas ref="this_canvas_mark" class="this_canvas_mark"></canvas>
      <div class="hgroup"></div>
      <div class="this_msg_error"></div>
      <div class="this_msg_ok"></div>
      <div class="slide">
        <div ref="slide_block" class="slide_block"></div>
        <div ref="slide_block_text" class="slide_block_text">拖动左边滑块完成上方拼图</div>
      </div>
      <div class="tools">
        <div ref="this_close" class="this_close"></div>
        <div ref="this_refresh" class="this_refresh"></div>
        <div class="this_tips"></div>
      </div>
    </div>
  </div>
</template>

<script>
/*! this 1.2 author:weiyingbin email:277612909@qq.com
//@ object webiste: http://www.39gs.com/archive/259.html
//@ https://github.com/binwind8/this
*/
import { Base64 } from "js-base64";
export default {
  data() {
    return {
      _obj: null,
      _this: null,
      _img: null,
      _img_loaded: false,
      _is_draw_bg: false,
      _is_moving: false,
      _block_start_x: 0,
      _block_start_y: 0,
      _doing: false,
      _mark_w: 50,
      _mark_h: 50,
      _mark_offset: 0,
      _img_w: 240,
      _img_h: 150,
      _result: false,
      _err_c: 0,
      _onsuccess: null
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    /**** class opration ****/
    hasClass(elem, cls) {
      cls = cls || "";
      if (cls.replace(/\s/g, "").length == 0) return false; //当cls没有参数时，返回false
      var ret = new RegExp(" " + cls + " ").test(" " + elem.className + " ");
      return ret;
    },
    getElementByClassName(className, index) {
      let nodes = this.$refs.validate_box; //获取页面里所有元素，因为他会匹配全页面元素，所以性能上有缺陷，但是可以约束他的搜索范围；
      let arr = []; //用来保存符合的className；
      for (var i = 0; i < nodes.length; i++) {
        if (this.hasClass(nodes[i], className)) arr.push(nodes[i]);
      }
      if (!index) index = 0;
      return index == -1 ? arr : arr[index];
    },
    addClass(elements, cName) {
      if (!this.hasClass(elements, cName)) {
        elements.className += " " + cName;
      }
    },
    removeClass(elements, cName) {
      if (this.hasClass(elements, cName)) {
        elements.className = elements.className.replace(
          new RegExp("(\\s|^)" + cName + "(\\s|$)"),
          " "
        ); // replace方法是替换
      }
    },
    /**** class opration ****/
    _bind(elm, evType, fn) {
      //event.preventDefault();
      if (elm.addEventListener) {
        elm.addEventListener(evType, fn); //DOM2.0
        return true;
      } else if (elm.attachEvent) {
        var r = elm.attachEvent(evType, fn); //IE5+
        return r;
      }
    },
    _block_start_move(e) {
      if (this._doing || !this._img_loaded) {
        return;
      }
      e.preventDefault();
      var theEvent = window.event || e;
      if (theEvent.touches) {
        theEvent = theEvent.touches[0];
      }

      console.log("_block_start_move");

      var obj = this.$refs.slide_block_text;
      obj.style.display = "none";
      this._draw_bg();
      this._block_start_x = theEvent.clientX;
      this._block_start_y = theEvent.clientY;
      this._doing = true;
      this._is_moving = true;
    },
    _block_on_move(e) {
      if (!this._doing) return true;
      if (!this._is_moving) return true;
      e.preventDefault();
      var theEvent = window.event || e;
      if (theEvent.touches) {
        theEvent = theEvent.touches[0];
      }
      this._is_moving = true;
      console.log("_block_on_move");
      //document.getElementById('msg').innerHTML = "move:"+theEvent.clientX+";"+theEvent.clientY;
      var offset = theEvent.clientX - this._block_start_x;
      if (offset < 0) {
        offset = 0;
      }
      var max_off = this._img_w - this._mark_w;
      if (offset > max_off) {
        offset = max_off;
      }
      var obj = this.$refs.slide_block;

      obj.style.cssText = "transform: translate(" + offset + "px, 0px)";
      this._mark_offset = (offset / max_off) * (this._img_w - this._mark_w);
      this._draw_bg();
      this._draw_mark();
    },
    _block_on_end(e) {
      if (!this._doing) return true;
      e.preventDefault();
      var theEvent = window.event || e;
      if (theEvent.touches) {
        theEvent = theEvent.touches[0];
      }
      this._is_moving = false;
      this._send_result();
    },
    _send_result() {
      var haddle = {
        success: this._send_result_success,
        failure: this._send_result_failure
      };
      this._result = false;
      // var re = new _ajax();
      // send result
      // re.request(
      //   "get",
      //   this._currentUrl() + "check.php?tn_r=" + this._mark_offset,
      //   haddle
      // );
    },
    _send_result_success(responseText, responseXML) {
      this._doing = false;
      if (responseText == "ok") {
        this._this.innerHTML = "验证成功";
        this._showmsg("验证成功", 1);
        this._result = true;
        this.getElementByClassName("hgroup").style.display = "block";
        setTimeout(this.hide, 3000);
        if (this._onsuccess) {
          this._onsuccess();
        }
      } else {
        var obj = document.getElementById("this_div");
        addClass(obj, "dd");
        setTimeout(function() {
          removeClass(obj, "dd");
        }, 200);
        this._result = false;
        this._showmsg("验证失败");
        this._err_c++;
        if (this._err_c > 5) {
          this.refresh();
        }
      }
    },
    _send_result_failure(xhr, status) {},
    _draw_fullbg() {
      var canvas_bg = this.$refs.this_canvas_bg;
      var ctx_bg = canvas_bg.getContext("2d");
      ctx_bg.drawImage(
        this._img,
        0,
        this._img_h * 2,
        this._img_w,
        this._img_h,
        0,
        0,
        this._img_w,
        this._img_h
      );
    },
    _draw_bg() {
      if (this._is_draw_bg) {
        return;
      }
      this._is_draw_bg = true;
      var canvas_bg = this.$refs.this_canvas_bg;
      var ctx_bg = canvas_bg.getContext("2d");
      ctx_bg.drawImage(
        this._img,
        0,
        0,
        this._img_w,
        this._img_h,
        0,
        0,
        this._img_w,
        this._img_h
      );
    },
    _draw_mark() {
      let canvas_mark = this.$refs.this_canvas_mark;
      let ctx_mark = canvas_mark.getContext("2d");
      //清理画布
      ctx_mark.clearRect(0, 0, canvas_mark.width, canvas_mark.height);
      ctx_mark.drawImage(
        this._img,
        0,
        this._img_h,
        this._mark_w,
        this._img_h,
        this._mark_offset,
        0,
        this._mark_w,
        this._img_h
      );
      let imageData = ctx_mark.getImageData(0, 0, this._img_w, this._img_h);
      // 获取画布的像素信息
      // 是一个一维数组，包含以 RGBA 顺序的数据，数据使用  0 至 255（包含）的整数表示
      // 如：图片由两个像素构成，一个像素是白色，一个像素是黑色，那么 data 为
      // [255,255,255,255,0,0,0,255]
      // 这个一维数组可以看成是两个像素中RBGA通道的数组的集合即:
      // [R,G,B,A].concat([R,G,B,A])
      var data = imageData.data;
      //alert(data.length/4);
      var x = this._img_h,
        y = this._img_w;
      for (var j = 0; j < x; j++) {
        var ii = 1,
          k1 = -1;
        for (var k = 0; k < y && k >= 0 && k > k1; ) {
          // 得到 RGBA 通道的值
          var i = (j * y + k) * 4;
          k += ii;
          var r = data[i],
            g = data[i + 1],
            b = data[i + 2];
          // 我们从最下面那张颜色生成器中可以看到在图片的右上角区域，有一小块在
          // 肉眼的观察下基本都是白色的，所以我在这里把 RGB 值都在 245 以上的
          // 的定义为白色
          // 大家也可以自己定义的更精确，或者更宽泛一些
          if (r + g + b < 200) data[i + 3] = 0;
          else {
            var arr_pix = [1, -5];
            var arr_op = [250, 0];
            for (var i = 1; i < arr_pix[0] - arr_pix[1]; i++) {
              var iiii = arr_pix[0] - 1 * i;
              var op = parseInt(
                arr_op[0] -
                  ((arr_op[0] - arr_op[1]) / (arr_pix[0] - arr_pix[1])) * i
              );
              var iii = (j * y + k + iiii * ii) * 4;
              data[iii + 3] = op;
            }
            if (ii == -1) {
              break;
            }
            k1 = k;
            k = y - 1;
            ii = -1;
          }
        }
      }
      ctx_mark.putImageData(imageData, 0, 0);
    },
    _reset() {
      this._mark_offset = 0;
      this._draw_bg();
      this._draw_mark();
      var obj = this.$refs.slide_block;
      obj.style.cssText = "transform: translate(0px, 0px)";
    },
    show() {
      var obj = this.getElementByClassName("hgroup");
      if (obj) {
        obj.style.display = "none";
      }
      this.refresh();
      this._this = this;
      document.getElementById("this_div_bg").style.display = "block";
      document.getElementById("this_div").style.display = "block";
    },
    hide() {
      document.getElementById("this_div_bg").style.display = "none";
      document.getElementById("this_div").style.display = "none";
    },
    _showmsg(msg, status) {
      if (!status) {
        status = 0;
        var obj = this.getElementByClassName("this_msg_error");
      } else {
        var obj = this.getElementByClassName("this_msg_ok");
      }
      obj.innerHTML = msg;
      var setOpacity = function(ele, opacity) {
        if (ele.style.opacity != undefined) {
          ///兼容FF和GG和新版本IE
          ele.style.opacity = opacity / 100;
        } else {
          ///兼容老版本ie
          ele.style.filter = "alpha(opacity=" + opacity + ")";
        }
      };
      function fadeout(ele, opacity, speed) {
        if (ele) {
          var v =
            ele.style.filter.replace("alpha(opacity=", "").replace(")", "") ||
            ele.style.opacity ||
            100;
          v < 1 && (v = v * 100);
          var count = speed / 1000;
          var avg = (100 - opacity) / count;
          var timer = null;
          timer = setInterval(function() {
            if (v - avg > opacity) {
              v -= avg;
              setOpacity(ele, v);
            } else {
              setOpacity(ele, 0);
              if (status == 0) {
                this._reset();
              }
              clearInterval(timer);
            }
          }, 100);
        }
      }
      function fadein(ele, opacity, speed) {
        if (ele) {
          var v =
            ele.style.filter.replace("alpha(opacity=", "").replace(")", "") ||
            ele.style.opacity;
          v < 1 && (v = v * 100);
          var count = speed / 1000;
          var avg = count < 2 ? opacity / count : opacity / count - 1;
          var timer = null;
          timer = setInterval(function() {
            if (v < opacity) {
              v += avg;
              setOpacity(ele, v);
            } else {
              clearInterval(timer);
              setTimeout(function() {
                fadeout(obj, 0, 6000);
              }, 1000);
            }
          }, 100);
        }
      }

      fadein(obj, 80, 4000);
    },
    refresh() {
      let isSupportWebp =
        !![].map &&
        document
          .createElement("canvas")
          .toDataURL("image/webp")
          .indexOf("data:image/webp") == 0;
      let _this = this;
      this._err_c = 0;
      this._is_draw_bg = false;
      this._result = false;
      this._img_loaded = false;
      let obj = this.$refs.this_canvas_bg;
      obj.style.display = "none";
      obj = this.$refs.this_canvas_mark;
      obj.style.display = "none";
      this._img = new Image();
      let img_url =
        "data:image/png;base64,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mTt6IfHscvpkrj4obbVu/lQVM7MuJevapkt3qmq/tNKbaNb3/T2gjuG1IFfNevfWcgOYm8HHQSduCd6FEN1KCa1GhLCvIQBiXk10VvggAHqhRMGm6PT84hnbUgXI2VTKyvvF8oNCLoawY9apThSh747VLwoqx8a9gUi2JKKW12bq6AWV2VqlUj/nmENVpCsGVyAd0GgApIKPPadkuKTfOecjXF1jyniDnt/ZnZMkwQVhVuxMxqOuXSoK0T6EpNiHzM2PAoLDinjRUeQcU+4FY7elaCka1c973sS4CxRA0hA1agj7ljvLnWghEiBx1R8XXl0t9/9mh9s9BETP5xtagWUzcx0UQ3gR5HxQdZuqZrMTYEclig6QPcQq54Dcd/3nRbyqYRq0cMDEIaYhAFO3VYhDETVrVGfusNTDs3voHK31QQpjHwN6MXrWKoYgm0eEk7Y/3nQqEw2zojifc+9euTUxDuDDoBcshdS7I6uo+2EMl4ELglgUU9EpYEUxDnEmiCFOQpjAEbQESjPN7sdpcZxWR/2cPQzoBSlw1umuZt6Y3WrWf6nnX3Qny7wwKVR2c+6Lssp5s15/JOI573ZpHeIkxEsxTPvuU/da9ZLqTquTjUGDlNUl0R23oVuZsnd9K5Akers7uN3eubm59VlzaJzQ9GKi+1kTuqiqDx5+dBCkEP9DKBXYLaeXqgvj3Axj5VIumgftyaeLlBXxYjkJ7mMJO1qUxeHKy3/WDz5p7s7C+I3RtUEYztOqtW4nTPvczdNKoJWWbW7v90efd3eblCwqhgX+i3PBib7Wmf2he/NPmoPry+O1BwmG7c6/R/DbT6/5ygN/5knDtosSHJ98zcXP/BVPQSwKHu9kJHoO0c/MKnTv3XegfXvs+ZlW/0+npj/7zOOr/ufYQQWN4f2HOKhxYfiyh4VeVfHsm6GvUve7O4jfymKHOxKDaHoh0b/x892B/lut5zyjISrR2eLu7rn1qo1F2LZuhjigX5pSst3+LRLlSUDh7jBAAYdnSJBtOZHA3QSAqECe3my/HF//p/ePnP6+T/1sNnt49OhljwwRERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERER0bfp3xc8YVYriAMWAAAAAElFTkSuQmCC";
      this._img.src = img_url;
      this._img.onload = () => {
        // this._draw_fullbg();
        var canvas_mark = this.$refs.this_canvas_mark;
        var ctx_mark = canvas_mark.getContext("2d");
        //清理画布
        ctx_mark.clearRect(0, 0, canvas_mark.width, canvas_mark.height);
        this._img_loaded = true;
        obj = this.$refs.this_canvas_bg;
        obj.style.display = "";
        obj = this.$refs.this_canvas_mark;
        obj.style.display = "";
        this._reset();
      };
      //alert("Hong Kong ForHarvest Technology and Culture Development Co. Limited".length);
      obj = this.$refs.slide_block;
      obj.style.cssText = "transform: translate(0px, 0px)";
      obj = this.$refs.slide_block_text;
      obj.style.display = "block";
    },
    init() {
      let _this = this;
      if (!this._img) {
        let slide_block = this.$refs["slide_block"];

        this._bind(slide_block, "mousedown", _this._block_start_move);
        this._bind(document, "mousemove", _this._block_on_move);
        this._bind(document, "mouseup", _this._block_on_end);

        this._bind(slide_block, "touchstart", _this._block_start_move);
        this._bind(document, "touchmove", _this._block_on_move);
        this._bind(document, "touchend", _this._block_on_end);

        let this_close = this.$refs.this_close;
        this._bind(this_close, "touchstart", _this.hide);
        this._bind(this_close, "click", _this.hide);

        let this_refresh = this.$refs.this_refresh;

        this._bind(this_refresh, "touchstart", _this.refresh);
        this._bind(this_refresh, "click", _this.refresh);

        let tncode_start = this.$refs.tncode_start;
          tncode_start.innerHTML = "点击按钮进行验证";
          this._bind(tncode_start, "touchstart", _this.show);
          this._bind(tncode_start, "click", _this.show);
      }
    },
    result: function() {
      return this._result;
    },
    onsuccess: function(fn) {
      this._onsuccess = fn;
    }
  }
};
</script>

<style>
/*按钮*/
.clear {
  clear: both;
}
.this {
  border: 1px solid #ccc;
  border-radius: 2px;
  width: 260px;
  height: 44px;
  cursor: pointer;
  opacity: 1;
  line-height: 44px;
}
/*浮层*/
.this_div_bg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0.3;
  filter: alpha(opacity=30);
  background-color: #000;
  *zoom: 1;
  display: none;
}
.this_div {
  display: none;
  background-color: white;
  z-index: 1000000;
  width: 260px;
  height: 260px;
  position: absolute;
  left: 50%;
  top: 50%;
  margin-top: -130px;
  margin-left: -130px;
  border: 1px solid #d1d1d1;
  border-radius: 2px;
  overflow: hidden;
  filter: progid:DXImageTransform.Microsoft.Shadow(color='#969696',Direction=135, Strength=5); /*for ie6,7,8*/
  /*background-color: #ccc;*/
  -moz-box-shadow: 2px 2px 5px #969696; /*firefox*/
  -webkit-box-shadow: 2px 2px 5px #969696; /*webkit*/
  box-shadow: 2px 2px 5px #969696; /*opera或ie9*/
}
.this_div .this_canvas_bg {
  z-index: 0;
}
.this_div .this_canvas_mark {
  z-index: 10000;
}
.this_div canvas {
  position: absolute;
  left: 10px;
  top: 10px;
}
.this_div .loading {
  padding-top: 60px;
  position: absolute;
  left: 10px;
  top: 10px;
  background-color: #ccc;
  width: 240px;
  height: 150px;
  text-align: center;
  box-sizing: border-box;
}
.dd {
  -webkit-transform: rotate(-45deg);
  -moz-transform: rotate(-45deg);
  -ms-transform: rotate(-45deg);
  -o-transform: rotate(-45deg);
  transform: rotate(-45deg);
  -webkit-animation: ddf 0.1s ease-in 0s infinite;
  -o-animation: ddf 0.1s ease-in 0s infinite;
  animation: ddf 0.1s ease-in 0s infinite;
}
@-webkit-keyframes ddf {
  0% {
    -webkit-transform: translate(-8px, 3px);
  }
  20% {
    -webkit-transform: translate(-3px, 1.5px);
  }
  50% {
    -webkit-transform: translate(0px, 0px);
  }
  70% {
    -webkit-transform: translate(5px, -1.5px);
  }
  100% {
    -webkit-transform: translate(0px, 0px);
  }
}
@-o-keyframes ddf {
  0% {
    -o-transform: translate(-8px, 3px);
  }
  20% {
    -o-transform: translate(-3px, 1.5px);
  }
  50% {
    -o-transform: translate(0px, 0px);
  }
  70% {
    -o-transform: translate(5px, -1.5px);
  }
  100% {
    -o-transform: translate(0px, 0px);
  }
}
@-moz-keyframes ddf {
  0% {
    -moz-transform: translate(-8px, 3px);
  }
  20% {
    -moz-transform: translate(-3px, 1.5px);
  }
  50% {
    -moz-transform: translate(0px, 0px);
  }
  70% {
    -moz-transform: translate(5px, -1.5px);
  }
  100% {
    -moz-transform: translate(0px, 0px);
  }
}
@keyframes ddf {
  0% {
    transform: translate(-8px, 3px);
  }
  20% {
    transform: translate(-3px, 1.5px);
  }
  50% {
    transform: translate(0px, 0px);
  }
  70% {
    transform: translate(5px, -1.5px);
  }
  100% {
    transform: translate(0px, 0px);
  }
}
.hgroup {
  z-index: 20000;
  content: "";
  position: absolute;
  left: -800px;
  top: 70px;
  width: 250px;
  height: 15px;
  background-color: rgba(255, 255, 255, 0.5);
  -webkit-transform: rotate(-45deg);
  -moz-transform: rotate(-45deg);
  -ms-transform: rotate(-45deg);
  -o-transform: rotate(-45deg);
  transform: rotate(-45deg);
  -webkit-animation: searchLights 3s ease-in 0s infinite;
  -o-animation: searchLights 3s ease-in 0s infinite;
  animation: searchLights 3s ease-in 0s infinite;
}

@-webkit-keyframes searchLights {
  0% {
    left: -800px;
    top: 70px;
  }

  to {
    left: 350px;
    top: 70px;
  }
}

@-o-keyframes searchLights {
  0% {
    left: -800px;
    top: 70px;
  }

  to {
    left: 350px;
    top: 70px;
  }
}

@-moz-keyframes searchLights {
  0% {
    left: -800px;
    top: 70px;
  }

  to {
    left: 350px;
    top: 70px;
  }
}

@keyframes searchLights {
  0% {
    left: -800px;
    top: 70px;
  }

  to {
    left: 350px;
    top: 70px;
  }
}

/*拉条*/
.slide,
.slide_block,
.tools .this_close,
.tools .this_refresh {
  background-repeat: no-repeat;
  background-image: url("../assets/icon.png");
}
.this_msg_ok {
  background-color: #24c628;
}
.this_msg_error {
  background-color: #de5145;
}
.this_msg_ok,
.this_msg_error {
  position: absolute;
  top: 136px;
  left: 10px;
  width: 220px;
  height: 20px;
  color: #fff;
  margin: 0;
  padding: 2px 10px;
  overflow: visible;
  background-position: 0px 0px;
  font-size: 14px;
  opacity: 0;
  filter: alpha(opacity=0);
  z-index: 10000;
}
.slide {
  position: absolute;
  top: 160px;
  width: 93.52%;
  height: 0px;
  background-color: white;
  background-size: 100%;
  margin: 5.39% 3.24%;
  padding: 0px 0px 13.67%;
  overflow: visible;
  background-position: 0px 0px;
}

.tools {
  position: absolute;
  top: 210px;
  width: 93.52%;
  height: 0px;
  background-color: white;
  background-size: 100%;
  margin: 5.39% 3.24%;
  padding: 5px 0px 13.67%;
  overflow: visible;
  background-position: 0px 0px;
  border-top: 1px solid #eeeeee;
}

.slide_block {
  background-position: 0px 12.9794%;
  width: 65px;
  height: 65px;
  position: absolute;
  left: 0px;
  top: 0px;
  margin: -4.62% 0 0 -2.31%;
  cursor: pointer;
}
.slide_block_text {
  background-position: 0px 12.9794%;
  height: 65px;
  position: absolute;
  left: 65px;
  top: 20px;
  margin: -4.62% 0 0 -2.31%;
  cursor: pointer;
  font-size: 14px;
  color: rgb(136, 148, 157);
}

.this_canvas_bg,
.this_canvas_mark {
  /* width: 240px;*/
}

.tools .this_close {
  background-position: 0 50%;
  height: 30px;
  width: 30px;
  float: left;
  margin-right: 10px;
  cursor: pointer;
}
.tools .this_refresh {
  background-position: 0 94%;
  height: 30px;
  width: 30px;
  float: left;
  cursor: pointer;
}
.tools .this_tips {
  float: right;
}
.tools .this_tips a {
  text-decoration: none;
  font-size: 10px;
  color: rgb(136, 148, 157);
}
</style>