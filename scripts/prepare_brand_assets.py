"""Derive deterministic store-ready assets from the approved ImageGen master mark."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "assets" / "brand" / "symbol-master.png"
BRAND = ROOT / "assets" / "brand"
IMAGES = ROOT / "assets" / "images"
STORE = ROOT / "assets" / "store"
SCREENSHOTS = ROOT / "store-listing" / "screenshots"

IVORY = "#F8F3EA"
WARM_WHITE = "#FFFDFC"
BURGUNDY = "#6F1D3A"
INK = "#241E20"
GOLD = "#C7A86B"


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size=size)


def trimmed_symbol() -> Image.Image:
    image = Image.open(MASTER).convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError("Master symbol is empty")
    return image.crop(bbox)


def contain(symbol: Image.Image, canvas_size: tuple[int, int], ratio: float) -> Image.Image:
    width, height = canvas_size
    max_width, max_height = int(width * ratio), int(height * ratio)
    copy = symbol.copy()
    copy.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    canvas.alpha_composite(copy, ((width - copy.width) // 2, (height - copy.height) // 2))
    return canvas


def save_icon(symbol: Image.Image) -> None:
    icon = Image.new("RGB", (1024, 1024), IVORY)
    layer = contain(symbol, icon.size, 0.72)
    icon.paste(layer, mask=layer.getchannel("A"))
    icon.save(IMAGES / "icon.png")

    foreground = contain(symbol, (1024, 1024), 0.54)
    foreground.save(IMAGES / "android-icon-foreground.png")
    Image.new("RGB", (1024, 1024), IVORY).save(IMAGES / "android-icon-background.png")

    mono = foreground.getchannel("A")
    monochrome = Image.new("RGBA", foreground.size, (255, 255, 255, 0))
    monochrome.putalpha(mono)
    monochrome.save(IMAGES / "android-icon-monochrome.png")

    contain(symbol, (1024, 1024), 0.42).save(IMAGES / "splash-icon.png")

    favicon = Image.new("RGB", (64, 64), IVORY)
    fav_layer = contain(symbol, favicon.size, 0.72)
    favicon.paste(fav_layer, mask=fav_layer.getchannel("A"))
    favicon.save(IMAGES / "favicon.png")

    notification_source = contain(symbol, (96, 96), 0.72)
    notification = Image.new("RGBA", notification_source.size, (255, 255, 255, 0))
    notification.putalpha(notification_source.getchannel("A"))
    notification.save(IMAGES / "notification-icon.png")


def save_logos(symbol: Image.Image) -> None:
    title_font = font("georgiab.ttf", 92)
    subtitle_font = font("arial.ttf", 30)

    primary = Image.new("RGB", (1200, 1200), WARM_WHITE)
    mark = contain(symbol, (1200, 700), 0.56)
    primary.paste(mark, (0, 28), mark)
    draw = ImageDraw.Draw(primary)
    title = "Düğün Planım"
    title_box = draw.textbbox((0, 0), title, font=title_font)
    draw.text(((1200 - (title_box[2] - title_box[0])) / 2, 760), title, font=title_font, fill=BURGUNDY)
    subtitle = "Hayalinizdeki günü birlikte planlayın."
    subtitle_box = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    draw.text(((1200 - (subtitle_box[2] - subtitle_box[0])) / 2, 900), subtitle, font=subtitle_font, fill=INK)
    primary.save(BRAND / "logo-primary.png")

    horizontal = Image.new("RGB", (1800, 600), WARM_WHITE)
    h_mark = contain(symbol, (560, 560), 0.72)
    horizontal.paste(h_mark, (20, 20), h_mark)
    h_draw = ImageDraw.Draw(horizontal)
    h_draw.text((590, 180), title, font=font("georgiab.ttf", 112), fill=BURGUNDY)
    h_draw.text((598, 325), subtitle, font=font("arial.ttf", 34), fill=INK)
    horizontal.save(BRAND / "logo-horizontal.png")


def save_store_assets(symbol: Image.Image) -> None:
    google_icon = contain(symbol, (512, 512), 0.74)
    google_icon.save(STORE / "google-play-icon.png", optimize=True)

    feature = Image.new("RGB", (1024, 500), BURGUNDY)
    draw = ImageDraw.Draw(feature)
    draw.ellipse((735, -170, 1110, 205), fill="#7E2947")
    draw.ellipse((835, 315, 1095, 575), fill="#8B3552")
    mark_bg = Image.new("RGBA", (280, 280), IVORY)
    mark = contain(symbol, mark_bg.size, 0.7)
    mark_bg.alpha_composite(mark)
    feature.paste(mark_bg.convert("RGB"), (690, 110))
    draw.text((70, 112), "Düğün Planım", font=font("georgiab.ttf", 72), fill=WARM_WHITE)
    draw.text((74, 215), "Hayalinizdeki günü", font=font("arialbd.ttf", 35), fill="#F1DDAE")
    draw.text((74, 260), "birlikte planlayın.", font=font("arialbd.ttf", 35), fill="#F1DDAE")
    feature.save(STORE / "feature-graphic.png")

    background = Image.new("RGB", (1290, 2796), IVORY)
    bg_draw = ImageDraw.Draw(background)
    bg_draw.ellipse((-340, -360, 610, 590), fill="#F0E2D1")
    bg_draw.ellipse((930, 2350, 1550, 2970), fill="#EAD7D9")
    bg_draw.rounded_rectangle((96, 132, 1194, 2664), radius=72, outline="#D9C3A2", width=3)
    background.save(STORE / "screenshot-background.png")

    pattern = Image.new("RGB", (1200, 1200), WARM_WHITE)
    p_draw = ImageDraw.Draw(pattern)
    for x in range(-100, 1300, 220):
        for y in range(-100, 1300, 220):
            p_draw.arc((x, y, x + 180, y + 180), 20, 200, fill="#E8D7C5", width=6)
            p_draw.arc((x + 55, y + 55, x + 235, y + 235), 200, 380, fill="#E2CDD1", width=6)
    pattern.save(BRAND / "decorative-pattern.png")


def rounded_screenshot(image: Image.Image, size: tuple[int, int], radius: int) -> Image.Image:
    copy = image.resize(size, Image.Resampling.LANCZOS).convert("RGBA")
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    copy.putalpha(mask)
    return copy


def save_store_screenshots(symbol: Image.Image) -> None:
    """Frame real UI captures at exact official store sizes without stretching their content."""
    targets = {
        "phone": (1290, 2796),
        "tablet": (2048, 2732),
    }
    titles = {
        "01-home": "Planın bir bakışta",
        "02-tasks": "Görevleri zamanında tut",
        "03-guests": "Davetli yanıtları düzenli",
        "04-budget": "Bütçeni net gör",
    }
    if not SCREENSHOTS.exists():
        return
    for source in SCREENSHOTS.glob("*-source.png"):
        kind = source.name.split("-", 1)[0]
        if kind not in targets:
            continue
        target_size = targets[kind]
        key = source.stem.removeprefix(f"{kind}-").removesuffix("-source")
        screenshot = Image.open(source).convert("RGB")
        screenshot = screenshot.crop((0, 0, screenshot.width, min(screenshot.height, 840)))
        canvas = Image.new("RGB", target_size, IVORY)
        draw = ImageDraw.Draw(canvas)
        draw.ellipse((-300, -360, 700, 640), fill="#F0E2D1")
        draw.ellipse(
            (target_size[0] - 520, target_size[1] - 460, target_size[0] + 180, target_size[1] + 240),
            fill="#EAD7D9",
        )
        if kind == "phone":
            mark = contain(symbol, (150, 150), 0.72)
            canvas.paste(mark, (1050, 86), mark)
            draw.text((90, 95), "Düğün Planım", font=font("arialbd.ttf", 34), fill=BURGUNDY)
            draw.text((90, 175), titles[key], font=font("georgiab.ttf", 60), fill=INK)
            draw.text((92, 265), "Tüm planlama verilerin cihazında.", font=font("arial.ttf", 30), fill="#6F6468")
            frame_width = 1110
            frame_height = round(screenshot.height * frame_width / screenshot.width)
            framed = rounded_screenshot(screenshot, (frame_width, frame_height), 54)
            x, y = (target_size[0] - frame_width) // 2, 455
            draw.rounded_rectangle(
                (x - 4, y - 4, x + frame_width + 4, y + frame_height + 4),
                radius=58,
                outline="#D9C3A2",
                width=5,
            )
            canvas.paste(framed, (x, y), framed)
        else:
            mark = contain(symbol, (180, 180), 0.72)
            canvas.paste(mark, (1760, 78), mark)
            draw.text((120, 95), "Düğün Planım", font=font("arialbd.ttf", 42), fill=BURGUNDY)
            draw.text((120, 185), titles[key], font=font("georgiab.ttf", 82), fill=INK)
            draw.text((124, 305), "Telefon ve tablet için sakin, erişilebilir planlama.", font=font("arial.ttf", 34), fill="#6F6468")
            frame_width = 1810
            frame_height = round(screenshot.height * frame_width / screenshot.width)
            framed = rounded_screenshot(screenshot, (frame_width, frame_height), 46)
            x, y = (target_size[0] - frame_width) // 2, 500
            draw.rounded_rectangle(
                (x - 5, y - 5, x + frame_width + 5, y + frame_height + 5),
                radius=51,
                outline="#D9C3A2",
                width=6,
            )
            canvas.paste(framed, (x, y), framed)
            draw.text((120, 2180), "Görevler · Davetliler · Bütçe · Masa planı", font=font("arialbd.ttf", 38), fill=BURGUNDY)
            draw.text((120, 2250), "İnternet hesabı gerekmeden, çevrimdışı çalışır.", font=font("arial.ttf", 34), fill=INK)
        canvas.save(SCREENSHOTS / source.name.replace("-source", ""), optimize=True)


def main() -> None:
    for directory in (BRAND, IMAGES, STORE, SCREENSHOTS):
        directory.mkdir(parents=True, exist_ok=True)
    symbol = trimmed_symbol()
    save_icon(symbol)
    save_logos(symbol)
    save_store_assets(symbol)
    save_store_screenshots(symbol)
    print("Brand assets prepared.")


if __name__ == "__main__":
    main()
