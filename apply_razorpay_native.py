#!/usr/bin/env python3
"""Apply Razorpay native Android checkout, preserving existing responsive/UI changes."""
from pathlib import Path
import sys, shutil

root = Path(__file__).resolve().parent
# Supports placing script in repository root, or one directory below.
if not (root / 'src/pages/CheckoutPage.jsx').is_file():
    print('ERROR: Place apply_razorpay_native.py in your frontend root (next to package.json).')
    sys.exit(1)
checkout = root / 'src/pages/CheckoutPage.jsx'
activity = root / 'android-user/app/src/main/java/com/thulirkumver/user/MainActivity.java'
if not activity.exists():
    print('ERROR: android-user MainActivity.java missing. This patch is for User APK only.')
    sys.exit(1)
text = checkout.read_text(encoding='utf-8')
if 'NativeCheckout.open' in text or 'Razorpay native Android checkout' in text:
    print('Checkout already seems patched. No changes made.')
    sys.exit(0)
anchor = "import { useEffect, useMemo, useState } from 'react'"
# Insert without knowing the exact React named imports.
if "from '@capacitor/core'" not in text:
    first_line = text.find('\n')
    text = text[:first_line+1] + "import { Capacitor } from '@capacitor/core'\n" + text[first_line+1:]

old = """      if (!window.Razorpay) {
        throw new Error('Razorpay Checkout could not be loaded. Please refresh the page.')
      }

      const options = {"""
new = """      const options = {"""
if text.count(old) != 1:
    raise RuntimeError('Expected web Razorpay guard not found exactly once. Stopped without changing files.')
text = text.replace(old, new, 1)
old2 = '      const razorpay = new window.Razorpay(options)'
new2 = """      // Razorpay native Android checkout: allows supported UPI apps to open from the APK.
      // Browser checkout remains unchanged. Never fall back to a second checkout after native failure.
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        const { Checkout: NativeCheckout } = await import('capacitor-razorpay')
        // Do not send browser-only functions through the native bridge.
        const { handler: onPaymentSuccess, modal: browserModal, ...nativeOptions } = options
        void browserModal
        const nativeResult = await NativeCheckout.open({
          ...nativeOptions,
          amount: String(razorpayOrder.amount),
        })
        let nativeResponse = nativeResult?.response ?? nativeResult
        if (typeof nativeResponse === 'string') nativeResponse = JSON.parse(nativeResponse)
        if (nativeResponse && typeof nativeResponse.response === 'object') {
          nativeResponse = nativeResponse.response
        }
        if (!nativeResponse?.razorpay_payment_id ||
            !nativeResponse?.razorpay_order_id ||
            !nativeResponse?.razorpay_signature) {
          throw new Error('Payment response was incomplete. Check payment status before trying again.')
        }
        // Only the backend can confirm and create an order, after verifying the signature.
        await onPaymentSuccess(nativeResponse)
        return
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay Checkout could not be loaded. Please refresh the page.')
      }
      const razorpay = new window.Razorpay(options)"""
if text.count(old2) != 1:
    raise RuntimeError('Expected Razorpay instance anchor not found exactly once. Stopped without changing files.')
text = text.replace(old2, new2, 1)
java = activity.read_text(encoding='utf-8')
if 'registerPlugin(Checkout.class)' in java:
    updated_java = java
else:
    if 'import com.getcapacitor.BridgeActivity;' not in java:
        raise RuntimeError('Unexpected MainActivity.java format. Stopped without changing files.')
    updated_java = '''package com.thulirkumver.user;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.ionicframework.capacitor.Checkout;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(Checkout.class);
        super.onCreate(savedInstanceState);
    }
}
'''
# Only modify once every source matched expectations.
for file in [checkout, activity]:
    backup = file.with_suffix(file.suffix + '.before-razorpay-native.bak')
    if not backup.exists(): shutil.copy2(file, backup)
checkout.write_text(text, encoding='utf-8')
activity.write_text(updated_java, encoding='utf-8')
print('SUCCESS: Native checkout added for Android User APK; website checkout retained.')
print('Original files backed up with .before-razorpay-native.bak extensions.')
print('NEXT: npm install capacitor-razorpay@1.3.0 && npm run build:user && npx cap sync android')
