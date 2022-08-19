{
    'target_defaults': {
        'default_configuration': 'Release'
    },
    'targets': [
        {
            'target_name': 'agora_plugin',
            'include_dirs': [
                './src',
                './window-monitor/include/',
                "<!(node -e \"require('nan')\")"
            ],
            'sources': [
                "<!@(node -p \"var fs=require('fs'),path=require('path'),walk=function(r){let t,e=[],n=null;try{t=fs.readdirSync(r)}catch(r){n=r.toString()}if(n)return n;var a=0;return function n(){var i=t[a++];if(!i)return e;let u=path.resolve(r,i);i=r+'/'+i;let c=fs.statSync(u);if(c&&c.isDirectory()){let r=walk(i);return e=e.concat(r),n()}return e.push(i),n()}()};walk('./src').join(' ');\")",
            ],
            'conditions': [
                [
                    'OS=="win"',
                    {
                        'copies': [{
                            'destination': '<(PRODUCT_DIR)',
                            'files': [
                                './base/bin/dll/agora_rtc_sdk.dll',
                                './base/bin/dll/agora_rtm_sdk.dll',
                                './base/bin/dll/av1.dll',
                                './base/bin/dll/libagora_ai_denoise_extension.dll',
                                './base/bin/dll/libagora_dav1d_extension.dll',
                                './base/bin/dll/libagora_fd_extension.dll',
                                './base/bin/dll/libagora_jnd_extension.dll',
                                './base/bin/dll/libagora_segmentation_extension.dll',
                                './base/bin/dll/libagora-core.dll',
                                './base/bin/dll/libagora-fdkaac.dll',
                                './base/bin/dll/libagora-ffmpeg.dll',
                                './base/bin/dll/libagora-mpg123.dll',
                                './base/bin/dll/libagora-soundtouch.dll',
                                './base/bin/dll/libagora-wgc.dll',
                                './base/bin/dll/libhwcodec.dll',
                                './base/bin/dll/zlibwapi.dll',
                            ]
                        }],
                        'library_dirs': [
                            './base/bin/lib',
                            './third_party/libyuv/lib',
                        ],
                        'link_settings': {
                            'libraries': [
                                '-lsqlite3.lib',
                                '-lvaloran.lib',
                                '-lws2_32.lib',
                                '-lgdiplus.lib',
                                '-lyuv.lib'
                            ]
                        },
                        'defines':[
                            'OS_WIN'
                        ],
                        'defines!': [
                            '_USING_V110_SDK71_',
                            '_HAS_EXCEPTIONS=0'
                        ],
                        'sources': [
                        ],
                        'include_dirs': [
                        ],
                        'configurations': {
                            'Release': {
                                'msvs_settings': {
                                    'VCCLCompilerTool': {
                                        'ExceptionHandling': '0',
                                        'AdditionalOptions': [
                                            '/EHsc'
                                        ]
                                    }
                                }
                            },
                            'Debug': {
                                'msvs_settings': {
                                    'VCCLCompilerTool': {
                                        'ExceptionHandling': '0',
                                        'AdditionalOptions': [
                                            '/EHsc'
                                        ]
                                    }
                                }
                            }
                        }
                    }
                ],
                [
                    'OS=="mac"',
                    {
                        'mac_framework_dirs': [
                            '../window-monitor/install'
                        ],
                        'copies': [{
                            'destination': '<(PRODUCT_DIR)',
                            'files': [
                                # './window-monitor/install/monitor.framework',
                            ]
                        }],
                        'library_dirs': [
                            '../window-monitor/install/lib',
                        ],
                        'libraries': ['libmonitor.a',],
                        'link_settings': {
                            'libraries': [
                                # 'monitor.framework',
                                'Cocoa.framework',
                                'Foundation.framework',
                            ]
                        },
                        'include_dirs': [
                            './window-monitor/include',
                        ],
                        'defines!': [
                            '_NOEXCEPT',
                            '-std=c++11'
                        ],
                        'OTHER_CFLAGS': [
                            '-std=c++11',
                            '-stdlib=libc++',
                            '-fexceptions'
                        ],
                        'xcode_settings': {
                            'MACOSX_DEPLOYMENT_TARGET': '10.14',
                            'EXECUTABLE_EXTENSION': 'node',
                            'FRAMEWORK_SEARCH_PATHS': [
                                './window-monitor/install'
                            ],
                            "DEBUG_INFORMATION_FORMAT": "dwarf-with-dsym"
                        },
                    }
                ]
            ]
        },
        {
            'target_name': 'after_build',
            'type': "none",
            'dependencies': [
                'agora_plugin'
            ]
        },
    ]
}
