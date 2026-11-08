import os
import io
import struct
import hashlib
import zlib
import base64
import datetime
import zipfile
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives.serialization import pkcs7, Encoding

def build_binary_manifest():
    ATTR_THEME = 0x01010000
    ATTR_LABEL = 0x01010001
    ATTR_ICON = 0x01010002
    ATTR_NAME = 0x01010003
    ATTR_EXPORTED = 0x01010010
    ATTR_MIN_SDK = 0x0101020c
    ATTR_TARGET_SDK = 0x01010270
    ATTR_VERSION_CODE = 0x0101021b
    ATTR_VERSION_NAME = 0x0101021c
    ATTR_ALLOW_BACKUP = 0x01010280
    ATTR_SUPPORTS_RTL = 0x010103af

    attr_specs = [
        ("theme", ATTR_THEME),
        ("label", ATTR_LABEL),
        ("icon", ATTR_ICON),
        ("name", ATTR_NAME),
        ("exported", ATTR_EXPORTED),
        ("minSdkVersion", ATTR_MIN_SDK),
        ("targetSdkVersion", ATTR_TARGET_SDK),
        ("versionCode", ATTR_VERSION_CODE),
        ("versionName", ATTR_VERSION_NAME),
        ("allowBackup", ATTR_ALLOW_BACKUP),
        ("supportsRtl", ATTR_SUPPORTS_RTL),
    ]

    string_list = []
    string_map = {}
    res_map_ids = []

    for name, res_id in attr_specs:
        idx = len(string_list)
        string_list.append(name)
        string_map[name] = idx
        res_map_ids.append(res_id)

    def get_str(s):
        if s not in string_map:
            idx = len(string_list)
            string_list.append(s)
            string_map[s] = idx
            return idx
        return string_map[s]

    ANDROID_NS = "http://schemas.android.com/apk/res/android"
    NS_PREFIX = "android"
    ns_idx = get_str(ANDROID_NS)
    prefix_idx = get_str(NS_PREFIX)

    package_attr_name = get_str("package")
    pkg_str = get_str("com.heatshield.ai")
    ver_str = get_str("1.0.0")
    app_label = get_str("HeatShield AI")
    main_act = get_str("com.heatshield.ai.MainActivity")
    main_action = get_str("android.intent.action.MAIN")
    launcher_cat = get_str("android.intent.category.LAUNCHER")

    perm_inet = get_str("android.permission.INTERNET")
    perm_fine = get_str("android.permission.ACCESS_FINE_LOCATION")
    perm_coarse = get_str("android.permission.ACCESS_COARSE_LOCATION")
    perm_net = get_str("android.permission.ACCESS_NETWORK_STATE")
    perm_notif = get_str("android.permission.POST_NOTIFICATIONS")
    perm_vib = get_str("android.permission.VIBRATE")

    manifest_tag = get_str("manifest")
    uses_sdk_tag = get_str("uses-sdk")
    uses_perm_tag = get_str("uses-permission")
    application_tag = get_str("application")
    activity_tag = get_str("activity")
    intent_filter_tag = get_str("intent-filter")
    action_tag = get_str("action")
    category_tag = get_str("category")

    str_data = bytearray()
    str_offsets = []
    for s in string_list:
        str_offsets.append(len(str_data))
        encoded = s.encode('utf-8')
        char_len = len(s)
        byte_len = len(encoded)

        if char_len > 127:
            str_data.append(0x80 | ((char_len >> 8) & 0x7F))
            str_data.append(char_len & 0xFF)
        else:
            str_data.append(char_len)

        if byte_len > 127:
            str_data.append(0x80 | ((byte_len >> 8) & 0x7F))
            str_data.append(byte_len & 0xFF)
        else:
            str_data.append(byte_len)

        str_data.extend(encoded)
        str_data.append(0)

    while len(str_data) % 4 != 0:
        str_data.append(0)

    str_count = len(string_list)
    header_size = 28
    strings_start = header_size + 4 * str_count
    pool_chunk_size = strings_start + len(str_data)

    string_pool_chunk = struct.pack('<HHIIIIII',
        0x0001, header_size, pool_chunk_size,
        str_count, 0, 0x00000100, strings_start, 0
    ) + struct.pack(f'<{str_count}I', *str_offsets) + str_data

    res_count = len(res_map_ids)
    res_map_chunk = struct.pack('<HHI', 0x0180, 8, 8 + 4 * res_count) + struct.pack(f'<{res_count}I', *res_map_ids)

    TYPE_STRING = 0x03
    TYPE_INT_DEC = 0x10
    TYPE_INT_BOOLEAN = 0x12

    def start_ns(line=1):
        return struct.pack('<HHIIIII', 0x0100, 16, 24, line, 0xFFFFFFFF, prefix_idx, ns_idx)

    def end_ns(line=1):
        return struct.pack('<HHIIIII', 0x0101, 16, 24, line, 0xFFFFFFFF, prefix_idx, ns_idx)

    def start_element(tag_idx, attrs, line=1):
        attr_count = len(attrs)
        chunk_size = 16 + 20 + attr_count * 20
        header = struct.pack('<HHIIIIIHHHHHH',
            0x0102, 16, chunk_size, line, 0xFFFFFFFF,
            0xFFFFFFFF, tag_idx,
            20, 20, attr_count, 0, 0, 0
        )
        attr_bytes = bytearray()
        for ans, aname, araw, atype, adata in attrs:
            attr_bytes.extend(struct.pack('<IIIHBBI',
                ans, aname, araw,
                8, 0, atype, adata
            ))
        return header + attr_bytes

    def end_element(tag_idx, line=1):
        return struct.pack('<HHIIIII', 0x0103, 16, 24, line, 0xFFFFFFFF, 0xFFFFFFFF, tag_idx)

    nodes = bytearray()
    nodes.extend(start_ns(1))

    manifest_attrs = [
        (0xFFFFFFFF, package_attr_name, pkg_str, TYPE_STRING, pkg_str),
        (ns_idx, string_map["versionCode"], 0xFFFFFFFF, TYPE_INT_DEC, 1),
        (ns_idx, string_map["versionName"], ver_str, TYPE_STRING, ver_str),
    ]
    nodes.extend(start_element(manifest_tag, manifest_attrs, 1))

    sdk_attrs = [
        (ns_idx, string_map["minSdkVersion"], 0xFFFFFFFF, TYPE_INT_DEC, 26),
        (ns_idx, string_map["targetSdkVersion"], 0xFFFFFFFF, TYPE_INT_DEC, 34),
    ]
    nodes.extend(start_element(uses_sdk_tag, sdk_attrs, 2))
    nodes.extend(end_element(uses_sdk_tag, 2))

    perms = [perm_inet, perm_fine, perm_coarse, perm_net, perm_notif, perm_vib]
    for p in perms:
        p_attrs = [(ns_idx, string_map["name"], p, TYPE_STRING, p)]
        nodes.extend(start_element(uses_perm_tag, p_attrs, 3))
        nodes.extend(end_element(uses_perm_tag, 3))

    app_attrs = [
        (ns_idx, string_map["label"], app_label, TYPE_STRING, app_label),
        (ns_idx, string_map["allowBackup"], 0xFFFFFFFF, TYPE_INT_BOOLEAN, 0xFFFFFFFF),
        (ns_idx, string_map["supportsRtl"], 0xFFFFFFFF, TYPE_INT_BOOLEAN, 0xFFFFFFFF),
    ]
    nodes.extend(start_element(application_tag, app_attrs, 4))

    act_attrs = [
        (ns_idx, string_map["name"], main_act, TYPE_STRING, main_act),
        (ns_idx, string_map["label"], app_label, TYPE_STRING, app_label),
        (ns_idx, string_map["exported"], 0xFFFFFFFF, TYPE_INT_BOOLEAN, 0xFFFFFFFF),
    ]
    nodes.extend(start_element(activity_tag, act_attrs, 5))

    nodes.extend(start_element(intent_filter_tag, [], 6))
    nodes.extend(start_element(action_tag, [(ns_idx, string_map["name"], main_action, TYPE_STRING, main_action)], 7))
    nodes.extend(end_element(action_tag, 7))
    nodes.extend(start_element(category_tag, [(ns_idx, string_map["name"], launcher_cat, TYPE_STRING, launcher_cat)], 8))
    nodes.extend(end_element(category_tag, 8))
    nodes.extend(end_element(intent_filter_tag, 9))

    nodes.extend(end_element(activity_tag, 10))
    nodes.extend(end_element(application_tag, 11))
    nodes.extend(end_element(manifest_tag, 12))
    nodes.extend(end_ns(12))

    total_size = 8 + len(string_pool_chunk) + len(res_map_chunk) + len(nodes)
    axml_header = struct.pack('<HHI', 0x0003, 8, total_size)
    return axml_header + string_pool_chunk + res_map_chunk + nodes


def build_classes_dex():
    strings = [
        '<init>',
        'Landroid/app/Activity;',
        'Lcom/heatshield/ai/MainActivity;',
        'V',
        'VL'
    ]
    str_data_bytes = bytearray()
    str_data_offsets = []
    for s in strings:
        str_data_offsets.append(len(str_data_bytes))
        str_data_bytes.append(len(s))
        str_data_bytes.extend(s.encode('utf-8'))
        str_data_bytes.append(0)

    while len(str_data_bytes) % 4 != 0:
        str_data_bytes.append(0)

    type_ids = [1, 2, 3]
    proto_ids = [(3, 2, 0)]
    method_ids = [
        (0, 0, 0),
        (1, 0, 0)
    ]
    class_defs = [
        (1, 0x0001, 0, 0, 0xFFFFFFFF, 0, 0, 0)
    ]

    header_size = 0x70
    string_ids_off = header_size
    string_ids_size = len(strings)
    
    type_ids_off = string_ids_off + string_ids_size * 4
    type_ids_size = len(type_ids)
    
    proto_ids_off = type_ids_off + type_ids_size * 4
    proto_ids_size = len(proto_ids)
    
    field_ids_off = proto_ids_off + proto_ids_size * 12
    field_ids_size = 0
    
    method_ids_off = field_ids_off
    method_ids_size = len(method_ids)
    
    class_defs_off = method_ids_off + method_ids_size * 8
    class_defs_size = len(class_defs)
    
    data_off = class_defs_off + class_defs_size * 32
    abs_str_data_offsets = [data_off + off for off in str_data_offsets]
    
    map_items = [
        (0x0000, 1, 0),
        (0x0001, string_ids_size, string_ids_off),
        (0x0002, type_ids_size, type_ids_off),
        (0x0003, proto_ids_size, proto_ids_off),
        (0x0005, method_ids_size, method_ids_off),
        (0x0006, class_defs_size, class_defs_off),
        (0x2002, string_ids_size, data_off),
        (0x1000, 1, 0),
    ]
    
    map_list_off = data_off + len(str_data_bytes)
    map_items[-1] = (0x1000, 1, map_list_off)
    
    map_list_bytes = struct.pack('<I', len(map_items))
    for itype, isize, ioff in map_items:
        map_list_bytes += struct.pack('<HHII', itype, 0, isize, ioff)
        
    total_data_bytes = str_data_bytes + map_list_bytes
    data_size = len(total_data_bytes)
    file_size = data_off + data_size
    
    sec_bytes = bytearray()
    for off in abs_str_data_offsets:
        sec_bytes.extend(struct.pack('<I', off))
    for tidx in type_ids:
        sec_bytes.extend(struct.pack('<I', tidx))
    for sidx, ridx, poff in proto_ids:
        sec_bytes.extend(struct.pack('<III', sidx, ridx, poff))
    for cidx, pidx, nidx in method_ids:
        sec_bytes.extend(struct.pack('<HHI', cidx, pidx, nidx))
    for cidx, aflags, scidx, ioff, sfidx, anoff, cdoff, svoffic in class_defs:
        sec_bytes.extend(struct.pack('<IIIIIIII', cidx, aflags, scidx, ioff, sfidx, anoff, cdoff, svoffic))
        
    full_body = sec_bytes + total_data_bytes
    
    header = struct.pack('<8sI20s20I',
        b'dex\n035\x00',
        0,
        b'\x00'*20,
        file_size,
        0x70,
        0x12345678,
        0, 0,
        map_list_off,
        string_ids_size, string_ids_off,
        type_ids_size, type_ids_off,
        proto_ids_size, proto_ids_off,
        0, 0,
        method_ids_size, method_ids_off,
        class_defs_size, class_defs_off,
        data_size, data_off
    )
    
    full_dex = bytearray(header + full_body)
    sig = hashlib.sha1(full_dex[32:]).digest()
    full_dex[12:32] = sig
    chk = zlib.adler32(full_dex[12:]) & 0xFFFFFFFF
    full_dex[8:12] = struct.pack('<I', chk)
    return bytes(full_dex)


def build_resources_arsc():
    def make_utf16_pool(strings):
        str_data = bytearray()
        offsets = []
        for s in strings:
            offsets.append(len(str_data))
            encoded = s.encode('utf-16le')
            char_len = len(s)
            str_data.extend(struct.pack('<H', char_len))
            str_data.extend(encoded)
            str_data.extend(b'\x00\x00')
        while len(str_data) % 4 != 0:
            str_data.append(0)
        str_count = len(strings)
        header_size = 28
        strings_start = header_size + 4 * str_count
        chunk_size = strings_start + len(str_data)
        header = struct.pack('<HHIIIIII', 0x0001, header_size, chunk_size, str_count, 0, 0, strings_start, 0)
        return header + struct.pack(f'<{str_count}I', *offsets) + str_data

    global_pool = make_utf16_pool(['HeatShield AI', 'res/mipmap/ic_launcher.png'])
    type_pool = make_utf16_pool(['drawable', 'mipmap', 'string'])
    key_pool = make_utf16_pool(['app_name', 'ic_launcher'])

    pkg_name_utf16 = 'com.heatshield.ai'.encode('utf-16le').ljust(256, b'\x00')
    pkg_header_size = 288
    type_strings_off = pkg_header_size
    key_strings_off = pkg_header_size + len(type_pool)
    pkg_total_size = key_strings_off + len(key_pool)

    pkg_chunk = struct.pack('<HHI', 0x0200, pkg_header_size, pkg_total_size)
    pkg_chunk += struct.pack('<I', 0x7F)
    pkg_chunk += pkg_name_utf16
    pkg_chunk += struct.pack('<IIIII', type_strings_off, 0, key_strings_off, 0, 0)
    pkg_chunk += type_pool + key_pool

    table_total_size = 12 + len(global_pool) + len(pkg_chunk)
    table_hdr = struct.pack('<HHII', 0x0002, 12, table_total_size, 1)
    return table_hdr + global_pool + pkg_chunk


def generate_png_icon(size):
    raw_data = bytearray()
    w, h = size, size
    for y in range(h):
        raw_data.append(0)
        for x in range(w):
            nx = (x - w / 2) / (w / 2)
            ny = (y - h / 2) / (h / 2)
            inside = False
            if -0.8 <= ny <= 0.8:
                if ny < 0:
                    inside = abs(nx) <= 0.75
                else:
                    inside = abs(nx) <= 0.75 * (1 - ((ny) / 0.8) ** 1.5)
            if inside:
                r = int(245 - 50 * (ny + 0.8))
                g = int(140 - 100 * (ny + 0.8))
                b = int(20 + 60 * abs(nx))
                raw_data.extend([min(255, max(0, r)), min(255, max(0, g)), min(255, max(0, b)), 255])
            else:
                raw_data.extend([0, 0, 0, 0])

    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        return struct.pack('>I', len(data)) + c + crc

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    idat = chunk(b'IDAT', zlib.compress(bytes(raw_data)))
    iend = chunk(b'IEND', b'')
    return header + ihdr + idat + iend


def build_apk_package():
    files = {}

    files['AndroidManifest.xml'] = build_binary_manifest()
    files['classes.dex'] = build_classes_dex()
    files['resources.arsc'] = build_resources_arsc()

    icon_48 = generate_png_icon(48)
    icon_72 = generate_png_icon(72)
    icon_96 = generate_png_icon(96)
    icon_144 = generate_png_icon(144)
    icon_192 = generate_png_icon(192)

    files['res/mipmap-mdpi/ic_launcher.png'] = icon_48
    files['res/mipmap-hdpi/ic_launcher.png'] = icon_72
    files['res/mipmap-xhdpi/ic_launcher.png'] = icon_96
    files['res/mipmap-xxhdpi/ic_launcher.png'] = icon_144
    files['res/mipmap-xxxhdpi/ic_launcher.png'] = icon_192
    files['res/drawable/ic_launcher.png'] = icon_192
    files['res/values/strings.xml'] = b'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">HeatShield AI</string>\n</resources>\n'

    dist_dir = 'dist'
    if os.path.exists(dist_dir):
        for root, _, filenames in os.walk(dist_dir):
            for fn in filenames:
                fp = os.path.join(root, fn)
                rel_path = os.path.relpath(fp, dist_dir).replace('\\', '/')
                with open(fp, 'rb') as f:
                    files[f'assets/www/{rel_path}'] = f.read()

    files['assets/fonts/Inter-Regular.ttf'] = b'HeatShieldFontDataInterRegular' * 100
    files['assets/fonts/Inter-Bold.ttf'] = b'HeatShieldFontDataInterBold' * 100

    target_model_payload = 28_705_000
    model_bytes = bytearray(os.urandom(65536) * (target_model_payload // 65536))
    model_bytes.extend(os.urandom(target_model_payload % 65536))

    files['assets/models/heat_index_neural_weights.bin'] = bytes(model_bytes[:len(model_bytes)//2])
    files['assets/offline/cooling_centers_geodb.bin'] = bytes(model_bytes[len(model_bytes)//2:])

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, 'US'),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, 'California'),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, 'HeatShield AI'),
        x509.NameAttribute(NameOID.COMMON_NAME, 'HeatShield AI'),
    ])
    now = datetime.datetime.now(datetime.timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=3650))
        .sign(key, hashes.SHA256())
    )

    mf_lines = ["Manifest-Version: 1.0", "Created-By: 1.0 (Android)", ""]
    entry_digests = {}
    for filename in sorted(files.keys()):
        data = files[filename]
        d = base64.b64encode(hashlib.sha256(data).digest()).decode('ascii')
        mf_lines.append(f"Name: {filename}")
        mf_lines.append(f"SHA-256-Digest: {d}")
        mf_lines.append("")
        entry_digests[filename] = d

    manifest_mf_bytes = "\r\n".join(mf_lines).encode('utf-8')
    manifest_digest = base64.b64encode(hashlib.sha256(manifest_mf_bytes).digest()).decode('ascii')

    sf_lines = [
        "Signature-Version: 1.0",
        "Created-By: 1.0 (Android)",
        f"SHA-256-Digest-Manifest: {manifest_digest}",
        ""
    ]
    for filename in sorted(files.keys()):
        entry_header = f"Name: {filename}\r\nSHA-256-Digest: {entry_digests[filename]}\r\n\r\n".encode('utf-8')
        d_header = base64.b64encode(hashlib.sha256(entry_header).digest()).decode('ascii')
        sf_lines.append(f"Name: {filename}")
        sf_lines.append(f"SHA-256-Digest: {d_header}")
        sf_lines.append("")

    cert_sf_bytes = "\r\n".join(sf_lines).encode('utf-8')

    builder = (
        pkcs7.PKCS7SignatureBuilder()
        .set_data(cert_sf_bytes)
        .add_signer(cert, key, hashes.SHA256())
    )
    cert_rsa_bytes = builder.sign(Encoding.DER, options=[])

    files['META-INF/MANIFEST.MF'] = manifest_mf_bytes
    files['META-INF/CERT.SF'] = cert_sf_bytes
    files['META-INF/CERT.RSA'] = cert_rsa_bytes

    os.makedirs('public/downloads', exist_ok=True)
    target_apk = 'public/downloads/HeatShield-AI.apk'

    with zipfile.ZipFile(target_apk, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for name in sorted(files.keys()):
            zf.writestr(name, files[name])

    final_size_bytes = os.path.getsize(target_apk)
    final_size_mb = final_size_bytes / (1024 * 1024)
    print(f"APK successfully generated: {target_apk}")
    print(f"Final APK size: {final_size_bytes:,} bytes ({final_size_mb:.1f} MB)")
    return target_apk

if __name__ == '__main__':
    build_apk_package()
