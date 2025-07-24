#include <node_buffer.h>
void ProcessBuffer(const v8::FunctionCallbackInfo<v8::Value>& args) {
    const uint8_t* data = (uint8_t*)node::Buffer::Data(args[0].As<v8::Object>());
    size_t length = node::Buffer::Length(args[0]);
}