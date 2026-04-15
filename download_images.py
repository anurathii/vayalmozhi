import json
import urllib.request
import time

products = json.load(open('data/products.json', encoding='utf-8'))
keywords = {
    1: 'cow,livestock',
    2: 'buffalo,animal',
    3: 'rice,seeds',
    4: 'tomato,seeds',
    5: 'fertilizer,sack',
    6: 'soil,compost',
    7: 'tractor,farm',
    8: 'agricultural,sprayer',
    9: 'chicken,poultry',
    10: 'tractor,blades',
    11: 'turmeric,spice',
    12: 'sugarcane,plant',
    13: 'banana,fruit',
    14: 'peanuts,farm'
}

print("Starting downloads...")
for p in products:
    pid = p.get('id')
    if pid in keywords:
        kw = keywords[pid]
        url = f"https://loremflickr.com/600/400/{kw}"
        filepath = f"static/images/prod_{pid}.jpg"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            res = urllib.request.urlopen(req)
            open(filepath, 'wb').write(res.read())
            p['image'] = f"/{filepath}"
            time.sleep(1)
        except Exception as e:
            print(f"Failed for {pid}: {e}")

json.dump(products, open('data/products.json', 'w', encoding='utf-8'), indent=2)
print("Done!")
