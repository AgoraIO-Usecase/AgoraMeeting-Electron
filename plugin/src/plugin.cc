#include <node_api.h>

#include "monitor.h"
#include "napi_event.h"
#include "napi_utils.h"

namespace {
using namespace agora::plugin;
static agora::plugin::NodeValoranEventBase<int> _window_monitor_events;

static void onWindowMonitorCallback(windowmonitor::WNDID winId,
                                    windowmonitor::EventType event,
                                    windowmonitor::CRect rect) {
  const int argc = 3;
  _window_monitor_events.Fire(
      winId, argc, [=](napi_env &env, napi_value argv[]) {
        NAPI_CALL_NORETURN(env, napi_create_int32(env, winId, &argv[0]));
        NAPI_CALL_NORETURN(
            env, napi_create_int32(env, static_cast<int32_t>(event), &argv[1]));
        // pack crect
        NAPI_CALL_NORETURN(env, napi_create_object(env, &argv[2]));
        NAPI_CALL_NORETURN(
            env, napi_obj_set_property(env, argv[2], "left", rect.left));
        NAPI_CALL_NORETURN(
            env, napi_obj_set_property(env, argv[2], "top", rect.top));
        NAPI_CALL_NORETURN(
            env, napi_obj_set_property(env, argv[2], "right", rect.right));
        NAPI_CALL_NORETURN(
            env, napi_obj_set_property(env, argv[2], "bottom", rect.bottom));
      });
}
}  // namespace

namespace agora {
namespace plugin {

napi_value registerWindowMonitor(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  NAPI_CALL(env, napi_get_cb_info(env, info, &argc, args, nullptr, nullptr));

  int winId;
  NAPI_CALL(env, napi_get_value_int32(env, args[0], &winId));

  int code = windowmonitor::registerWindowMonitorCallback(
      winId, onWindowMonitorCallback);

  napi_value result;
  NAPI_CALL(env, napi_create_int32(env, code, &result));
  if (code == windowmonitor::ErrorCode::Success) {
    napi_value cb = args[1];

    napi_value global;
    NAPI_CALL(env, napi_get_global(env, &global));

    _window_monitor_events.AddEvent(winId, env, cb, global);
  }

  return result;
}

napi_value unregisterWindowMonitor(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  NAPI_CALL(env, napi_get_cb_info(env, info, &argc, args, nullptr, nullptr));

  int winId;
  NAPI_CALL(env, napi_get_value_int32(env, args[0], &winId));

  windowmonitor::unregisterWindowMonitorCallback(winId);

  _window_monitor_events.RemoveEvent(winId);

  return napi_value();
}

napi_value init(napi_env env, napi_value exports) {
  NAPI_DEFINE_FUNC(env, exports, registerWindowMonitor,
                   "registerWindowMonitor");
  NAPI_DEFINE_FUNC(env, exports, unregisterWindowMonitor,
                   "unregisterWindowMonitor");

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init);
}  // namespace plugin
}  // namespace agora
