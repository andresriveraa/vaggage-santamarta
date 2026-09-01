# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# ── React Native Fabric / nueva arquitectura ──────────────────────────────────
# Con newArchEnabled=true, el C++ de Fabric lee FabricUIManager.mBinding con
# GetFieldID y la firma hardcodeada "Lcom/facebook/react/fabric/Binding;".
# Las reglas que trae RN cubren com.facebook.react.bridge.** y turbomodule.**
# pero NO com.facebook.react.fabric.**, así que R8 renombra Binding -> a y la
# app muere al renderizar el primer native-stack con:
#
#   java.lang.NoSuchFieldError: no type "Lcom/facebook/react/fabric/Binding;"
#   found and so no field "mBinding" could be found in class
#   "Lcom/facebook/react/fabric/FabricUIManager;"
#
# Solo pasa en release (minifyEnabled), nunca en debug.
-keep,includedescriptorclasses class com.facebook.react.fabric.** { *; }
-keep,includedescriptorclasses class com.facebook.react.runtime.** { *; }
-keep class com.facebook.jni.** { *; }

# ── sherpa-onnx (react-native-sherpa-onnx-offline-tts) ────────────────────────
# El JNI de sherpa-onnx usa registro estático (Java_com_k2fsa_sherpa_onnx_*) y,
# peor, lee los campos de las clases *Config por nombre con GetFieldID usando
# firmas hardcodeadas en libsherpa-onnx-jni.so ("Lcom/k2fsa/sherpa/onnx/
# OfflineTtsModelConfig;", "model", "vits", "tokens", "dataDir"...).
#
# Las reglas de RN salvan OfflineTts/OfflineTtsConfig porque aparecen en los
# descriptores de métodos nativos, pero NO salvan OfflineTtsModelConfig ni
# OfflineTtsVitsModelConfig: R8 solo las ve alcanzables desde Kotlin y las
# renombra a B3.a / B3.b. Entonces GetFieldID devuelve NULL, el C++ no lo
# verifica y el proceso muere con SIGABRT nativo al llamar initTTS().
#
# Esto solo pasa en release (minifyEnabled), nunca en debug.
-keep class com.k2fsa.sherpa.onnx.** { *; }
-keepclassmembers class com.k2fsa.sherpa.onnx.** { *; }
-keep class com.sherpaonnxofflinetts.** { *; }
-dontwarn com.k2fsa.sherpa.onnx.**
