package app.maxfit.tracker;

import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * MaxFit's own Android features:
 * - getAppInfo: installed version (to compare with the latest release)
 * - downloadAndInstall: download the new APK from MaxFit's GitHub release and open Android's installer
 * - saveToDevice: save a photo to the gallery (Pictures/MaxFit) or a file to Downloads/MaxFit
 * - shareFile: open the share menu (Instagram, Facebook, Messenger, ...)
 */
@CapacitorPlugin(name = "MaxFitNative")
public class MaxFitNativePlugin extends Plugin {

    /** Only MaxFit's own release files may be downloaded and installed. */
    private static final String RELEASE_PATH = "/augustof2022/maxfit/releases/download/";

    static boolean isOwnRelease(String url) {
        if (url == null) return false;
        Uri u = Uri.parse(url);
        String path = u.getPath();
        return "https".equals(u.getScheme()) && "github.com".equals(u.getHost()) && u.getPort() == -1
            && u.getUserInfo() == null && path != null && path.startsWith(RELEASE_PATH)
            && !path.contains("..") && !url.contains("%2e") && !url.contains("%2E") && path.endsWith(".apk");
    }

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        try {
            PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            long code = Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
            JSObject ret = new JSObject();
            ret.put("versionName", info.versionName);
            ret.put("versionCode", code);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not read the app version", e);
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        final String url = call.getString("url");
        if (!isOwnRelease(url)) {
            call.reject("Only MaxFit's own release file can be installed.");
            return;
        }
        // Android 8+: the user must allow this app to install updates (once).
        if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            JSObject ret = new JSObject();
            ret.put("status", "needs_permission");
            call.resolve(ret);
            return;
        }
        new Thread(() -> {
            HttpURLConnection c = null;
            try {
                File dir = new File(getContext().getCacheDir(), "updates");
                if (!dir.exists() && !dir.mkdirs()) throw new IOException("No space for the update");
                File out = new File(dir, "maxfit-update.apk");
                c = (HttpURLConnection) new URL(url).openConnection();
                c.setInstanceFollowRedirects(true);
                c.setConnectTimeout(20000);
                c.setReadTimeout(60000);
                int status = c.getResponseCode();
                if (status != 200) throw new IOException("Server answered " + status);
                long total = c.getContentLengthLong();
                try (InputStream in = new BufferedInputStream(c.getInputStream()); OutputStream os = new FileOutputStream(out)) {
                    byte[] buf = new byte[64 * 1024];
                    long got = 0;
                    int lastPct = -1;
                    int n;
                    while ((n = in.read(buf)) != -1) {
                        os.write(buf, 0, n);
                        got += n;
                        if (total > 0) {
                            int pct = (int) (got * 100 / total);
                            if (pct != lastPct) {
                                lastPct = pct;
                                JSObject p = new JSObject();
                                p.put("percent", pct);
                                notifyListeners("downloadProgress", p);
                            }
                        }
                    }
                }
                Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", out);
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setDataAndType(uri, "application/vnd.android.package-archive");
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                JSObject ret = new JSObject();
                ret.put("status", "installing");
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Download failed: " + e.getMessage(), e);
            } finally {
                if (c != null) c.disconnect();
            }
        }).start();
    }

    @PluginMethod
    public void saveToDevice(PluginCall call) {
        try {
            byte[] data = Base64.decode(call.getString("base64", ""), Base64.DEFAULT);
            String name = new File(call.getString("fileName", "maxfit")).getName();
            String mime = call.getString("mime", "application/octet-stream");
            boolean pics = "pictures".equals(call.getString("folder", "downloads"));
            String base = pics ? Environment.DIRECTORY_PICTURES : Environment.DIRECTORY_DOWNLOADS;
            Uri uri;
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues v = new ContentValues();
                v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
                v.put(MediaStore.MediaColumns.RELATIVE_PATH, base + "/MaxFit");
                Uri collection = pics ? MediaStore.Images.Media.EXTERNAL_CONTENT_URI : MediaStore.Downloads.EXTERNAL_CONTENT_URI;
                uri = getContext().getContentResolver().insert(collection, v);
                if (uri == null) throw new IOException("Could not create the file");
                try (OutputStream os = getContext().getContentResolver().openOutputStream(uri)) {
                    if (os == null) throw new IOException("Could not open the file");
                    os.write(data);
                }
            } else {
                // Android 9 and older need the storage permission (declared for those versions only).
                File dir = new File(Environment.getExternalStoragePublicDirectory(base), "MaxFit");
                if (!dir.exists() && !dir.mkdirs()) throw new IOException("Allow storage for MaxFit in Android settings, or use Share");
                File f = new File(dir, name);
                try (OutputStream os = new FileOutputStream(f)) {
                    os.write(data);
                }
                MediaScannerConnection.scanFile(getContext(), new String[] { f.getAbsolutePath() }, new String[] { mime }, null);
                uri = Uri.fromFile(f);
            }
            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not save: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void shareFile(PluginCall call) {
        try {
            byte[] data = Base64.decode(call.getString("base64", ""), Base64.DEFAULT);
            File dir = new File(getContext().getCacheDir(), "share");
            if (!dir.exists() && !dir.mkdirs()) throw new IOException("No space to share");
            File f = new File(dir, new File(call.getString("fileName", "maxfit.png")).getName());
            try (OutputStream os = new FileOutputStream(f)) {
                os.write(data);
            }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(call.getString("mime", "image/png"));
            send.putExtra(Intent.EXTRA_STREAM, uri);
            String text = call.getString("text");
            if (text != null) send.putExtra(Intent.EXTRA_TEXT, text);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, "Share");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getContext().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not share: " + e.getMessage(), e);
        }
    }
}
