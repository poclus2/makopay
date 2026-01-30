
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

interface FilterSheetProps {
    minPrice: number;
    maxPrice: number;
    plans: Array<{ id: string; name: string }>;
    selectedMinPrice: number;
    selectedMaxPrice: number;
    selectedPlanId: string | undefined;
    onPriceChange: (value: number[]) => void;
    onPlanChange: (value: string) => void;
    onReset: () => void;
    onApply: () => void;
}

export const FilterSheet = ({
    minPrice,
    maxPrice,
    plans,
    selectedMinPrice,
    selectedMaxPrice,
    selectedPlanId,
    onPriceChange,
    onPlanChange,
    onReset,
    onApply
}: FilterSheetProps) => {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full glass-card border-0">
                    <SlidersHorizontal className="w-5 h-5 text-foreground" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md bg-background/95 backdrop-blur-xl border-border/40">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-title text-foreground">{t('shop.filterApi', 'Filter Products')}</SheetTitle>
                </SheetHeader>

                <div className="space-y-8 py-4">
                    {/* Price Range */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-body font-medium">{t('shop.priceRange', 'Price Range')}</Label>
                            <span className="text-caption text-primary font-mono">
                                {formatCurrency(selectedMinPrice)} - {formatCurrency(selectedMaxPrice)}
                            </span>
                        </div>
                        <Slider
                            defaultValue={[selectedMinPrice, selectedMaxPrice]}
                            value={[selectedMinPrice, selectedMaxPrice]}
                            min={minPrice}
                            max={maxPrice}
                            step={10}
                            onValueChange={onPriceChange}
                            className="w-full"
                        />
                    </div>

                    {/* Investment Plan */}
                    <div className="space-y-4">
                        <Label className="text-body font-medium">{t('shop.investmentPlan', 'Investment Plan')}</Label>
                        <Select value={selectedPlanId} onValueChange={(val) => onPlanChange(val === 'all' ? '' : val)}>
                            <SelectTrigger className="w-full bg-card/40 border-border/20">
                                <SelectValue placeholder={t('shop.selectPlan', 'Select a plan')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all', 'All Plans')}</SelectItem>
                                {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur border-t border-border/10 flex-row gap-3 sm:justify-between">
                    <Button variant="outline" onClick={onReset} className="flex-1">
                        {t('common.reset', 'Reset')}
                    </Button>
                    <SheetClose asChild>
                        <Button onClick={onApply} className="flex-1 gradient-primary text-primary-foreground">
                            {t('common.apply', 'Apply Filters')}
                        </Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
