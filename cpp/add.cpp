#include <node.h>
#include <node_buffer.h>


#include <iostream>
#include <cstdint>

namespace demo {

using namespace v8;

// using v8::FunctionCallbackInfo;
// using v8::Function;
// using v8::Isolate;
// using v8::Local;
// using v8::Object;
// using v8::String;
// using v8::Value;
// using v8::Number;
// using v8::Exception;

// 示例方法：将两个数字相加
void Add(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  
  // 参数验证
  if (args.Length() < 2) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate, "need 2 args").ToLocalChecked()));
    return;
  }

  if (!args[0]->IsNumber() || !args[1]->IsNumber()) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate, "arg must be number").ToLocalChecked()));
    return;
  }

  // 执行加法运算
  double value = args[0].As<Number>()->Value() + args[1].As<Number>()->Value();
  args.GetReturnValue().Set(Number::New(isolate, value));
}


// 示例方法：将两个数字相加
void Log(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();


    //int
    int ssl = args[0]->Int32Value(context).ToChecked();


    //long
    int64_t fd = args[1]->IntegerValue(context).ToChecked();


    //string
    v8::String::Utf8Value utf8_value(isolate, args[2].As<v8::String>());
    const char* msg = *utf8_value;
    std::cout<<"fd = "<<fd<<", msg = "<<msg<<std::endl;

    
    //buffer
    const uint8_t* data = (uint8_t*)node::Buffer::Data(args[3].As<v8::Object>());
    size_t length = node::Buffer::Length(args[3]);

    
    //callback function(int,string,Buffer)
    v8::Local<v8::Function> jsCallback = v8::Local<v8::Function>::Cast(args[4]);
    const char* buf_raw = "buffer data";
    size_t buf_len = strlen(buf_raw);
    const int argc = 3;
    v8::Local<v8::Value> argv[argc] = { 
        v8::Number::New(isolate, 9607),
        v8::String::NewFromUtf8Literal(isolate, "ip address"),
        node::Buffer::Copy(isolate, buf_raw, buf_len).ToLocalChecked()
    };    
    jsCallback->Call(
        context, 
        Null(isolate), 
        argc, 
        argv
    );
}

// 初始化模块
void Initialize(Local<Object> exports) {
  NODE_SET_METHOD(exports, "add", Add);
  NODE_SET_METHOD(exports, "log", Log);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)

}  // namespace demo