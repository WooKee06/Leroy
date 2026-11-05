import PageContainer from "./PageContainer";
import Skeleton from "./Skeleton";
import styles from "./Skeletons.module.scss";

function cx(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

/* ---------- Products ---------- */

export function ProductCardSkeleton({
  variant = "medium",
}: {
  variant?: "small" | "medium";
}) {
  const small = variant === "small";

  return (
    <div className={cx(styles.productCard, small && styles.productCardSmall)}>
      <Skeleton className={styles.productImage} />
      <div className={styles.productInfo}>
        <Skeleton className={styles.productName} />
        <Skeleton className={styles.productPrice} />
        {!small && <Skeleton className={styles.productSeller} />}
        <Skeleton className={styles.productButton} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 6,
  variant = "medium",
  className,
}: {
  count?: number;
  variant?: "small" | "medium";
  className?: string;
}) {
  return (
    <div className={cx(styles.grid, className)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} variant={variant} />
      ))}
    </div>
  );
}

export function ProductRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.productRow} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.productRowItem}>
          <ProductCardSkeleton variant="small" />
        </div>
      ))}
    </div>
  );
}

/* ---------- Filters / chips ---------- */

export function ChipRowSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cx(styles.chipRow, className)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          className={styles.chip}
          style={{ width: 56 + (index % 3) * 24 }}
        />
      ))}
    </div>
  );
}

/* ---------- Stores ---------- */

export function StoreCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.storeCardsRow} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={styles.storeCard} />
      ))}
    </div>
  );
}

export function StoreListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.storeList} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.storeRow}>
          <Skeleton width={44} height={44} radius={14} />
          <div className={styles.storeRowInfo}>
            <Skeleton width="58%" height={14} radius={5} />
            <Skeleton width="38%" height={11} radius={4} />
          </div>
          <Skeleton width={42} height={12} radius={4} />
        </div>
      ))}
    </div>
  );
}

export function StorePageSkeleton() {
  return (
    <div className={styles.storePage} aria-hidden="true">
      <Skeleton className={styles.storeCover} radius={0} />

      <PageContainer>
        <div className={styles.storeHeader}>
          <Skeleton className={styles.storeAvatar} radius={24} />
          <div className={styles.storeIdentity}>
            <Skeleton width="52%" height={22} radius={6} />
            <Skeleton width="76%" height={13} radius={5} />
          </div>
        </div>

        <div className={styles.storeStats}>
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className={styles.storeStat}>
              <Skeleton width={34} height={18} radius={5} />
              <Skeleton width={48} height={10} radius={4} />
            </div>
          ))}
        </div>

        <div className={styles.storeTabs}>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className={styles.storeTab} />
          ))}
        </div>

        <ProductGridSkeleton count={4} />
      </PageContainer>
    </div>
  );
}

export function PromoSliderSkeleton() {
  return (
    <div className={styles.promoWrap} aria-hidden="true">
      <div className={styles.promoCard}>
        <Skeleton className={styles.promoImage} radius={20} />
        <div className={styles.promoInfo}>
          <Skeleton width="58%" height={17} radius={5} />
          <Skeleton width="34%" height={13} radius={4} />
        </div>
        <div className={styles.promoButtons}>
          <Skeleton className={styles.promoButton} />
          <Skeleton className={styles.promoButton} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Orders ---------- */

export function OrderCardSkeleton() {
  return (
    <div className={styles.orderCard} aria-hidden="true">
      <div className={styles.orderHead}>
        <Skeleton width={118} height={15} radius={5} />
        <Skeleton width={74} height={22} radius={100} />
      </div>
      <Skeleton width="62%" height={12} radius={4} />
      <div className={styles.orderFoot}>
        <Skeleton width={82} height={16} radius={5} />
        <Skeleton width={66} height={13} radius={4} />
      </div>
    </div>
  );
}

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.orderList} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <OrderCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className={styles.orderDetail} aria-hidden="true">
      <div className={styles.orderDetailHero}>
        <Skeleton width={86} height={22} radius={100} />
        <Skeleton width={72} height={13} radius={4} />
      </div>

      <div className={styles.orderDetailBlock}>
        <Skeleton width={82} height={17} radius={5} />

        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className={styles.orderDetailItem}>
            <Skeleton width={52} height={52} radius={12} />
            <div className={styles.orderDetailItemInfo}>
              <Skeleton width="68%" height={14} radius={5} />
              <Skeleton width="42%" height={12} radius={4} />
            </div>
            <Skeleton width={58} height={14} radius={4} />
          </div>
        ))}

        <div className={styles.orderDetailRow}>
          <Skeleton width={58} height={13} radius={4} />
          <Skeleton width={48} height={13} radius={4} />
        </div>
        <div className={styles.orderDetailRow}>
          <Skeleton width={44} height={16} radius={4} />
          <Skeleton width={64} height={16} radius={4} />
        </div>
      </div>

      <div className={styles.orderDetailBlock}>
        <Skeleton width={92} height={17} radius={5} />
        <Skeleton width="86%" height={13} radius={4} />
        <Skeleton width="54%" height={13} radius={4} />
      </div>
    </div>
  );
}

/* ---------- Cart ---------- */

export function CartSkeleton() {
  return (
    <div className={styles.cart} aria-hidden="true">
      <div className={styles.cartSeller}>
        <Skeleton width={118} height={15} radius={5} />
      </div>

      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className={styles.cartItem}>
          <div className={styles.cartItemTop}>
            <Skeleton width={90} height={90} radius={20} />
            <div className={styles.cartItemInfo}>
              <Skeleton width="74%" height={16} radius={5} />
              <Skeleton width="46%" height={12} radius={4} />
              <Skeleton width="32%" height={18} radius={5} />
            </div>
          </div>

          <Skeleton className={styles.cartDivider} height={1} radius={0} />

          <div className={styles.cartItemBottom}>
            <div className={styles.cartItemTotal}>
              <Skeleton width={86} height={11} radius={4} />
              <Skeleton width={68} height={18} radius={5} />
            </div>
            <Skeleton width={146} height={48} radius={25} />
          </div>
        </div>
      ))}

      <div className={styles.cartSummary}>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className={styles.cartSummaryRow}>
            <Skeleton width={index === 2 ? 46 : 62} height={15} radius={4} />
            <Skeleton width={index === 2 ? 72 : 56} height={15} radius={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Product page ---------- */

export function ProductPageSkeleton() {
  return (
    <div className={styles.productPage} aria-hidden="true">
      <Skeleton className={styles.productGallery} radius={32} />

      <div className={styles.productContent}>
        <div className={styles.productTitleLines}>
          <Skeleton width="86%" height={28} radius={7} />
          <Skeleton width="54%" height={28} radius={7} />
        </div>

        <Skeleton width="56%" height={14} radius={4} />

        <div className={styles.productSeller}>
          <Skeleton width={44} height={44} radius={14} />
          <div className={styles.productSellerInfo}>
            <Skeleton width={72} height={11} radius={4} />
            <Skeleton width={132} height={15} radius={5} />
          </div>
        </div>

        <div className={styles.productSwatches}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} width={34} height={34} circle />
          ))}
        </div>

        <div className={styles.productSizes}>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} width={48} height={38} radius={100} />
          ))}
        </div>

        <div className={styles.productTabs}>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} width={102} height={36} radius={100} />
          ))}
        </div>

        <div className={styles.productText}>
          <Skeleton width="100%" height={13} radius={4} />
          <Skeleton width="94%" height={13} radius={4} />
          <Skeleton width="72%" height={13} radius={4} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Addresses ---------- */

export function AddressListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className={styles.addressList} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.addressCard}>
          <div className={styles.addressHead}>
            <Skeleton width={64} height={24} radius={100} />
            <Skeleton width={70} height={24} radius={100} />
          </div>
          <Skeleton width="46%" height={15} radius={5} />
          <Skeleton width="88%" height={14} radius={4} />
          <Skeleton width="32%" height={12} radius={4} />
          <div className={styles.addressActions}>
            <Skeleton width={96} height={14} radius={4} />
            <Skeleton width={38} height={38} radius={12} />
            <Skeleton width={38} height={38} radius={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Forms ---------- */

export function StoreEditSkeleton() {
  return (
    <div className={styles.storeEdit} aria-hidden="true">
      <Skeleton width={224} height={26} radius={6} />

      <div className={styles.storeEditPreview}>
        <Skeleton className={styles.storeEditCover} radius={20} />
        <Skeleton className={styles.storeEditAvatar} radius={24} />
      </div>

      <div className={styles.storeEditForm}>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={styles.storeEditField}>
            <Skeleton width={72} height={12} radius={4} />
            <Skeleton
              width="100%"
              height={index === 1 ? 104 : 52}
              radius={14}
            />
          </div>
        ))}
        <Skeleton width="100%" height={50} radius={100} />
      </div>
    </div>
  );
}
