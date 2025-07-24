{
  "targets": [
    {
      "target_name": "addon",
      "sources": ["add.cpp"],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "conditions": [
        ["OS=='win'", {"defines": ["_HAS_EXCEPTIONS=1"]}]
      ]
    }
  ]
}